import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  deleteProductImages as deleteImagesFromS3,
  uploadProductImages as uploadImagesToS3,
} from "../lib/s3.js";
import { getListingStatus, isActiveListing, withSellerCoordinates } from "../lib/product.js";
import {
  ACTIVE_SERVICE_WHERE,
  buildServiceBrowseWhere,
  buildServiceOrderBy,
  formatService,
  formatServiceListing,
  parseServiceMode,
  parseServicePayload,
  parseServiceSort,
  parseServiceStatus,
  serviceBodyWithFallback,
} from "../lib/service.js";
import {
  getServiceCategories,
  listServiceCategoriesWithCounts,
  parseServiceCategory,
} from "../lib/serviceCategories.js";
import {
  analyzeServicePhotos,
  checkServiceQuality,
  draftServiceFromText,
  suggestServiceCapabilities,
} from "../lib/serviceAi.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSeller } from "../middleware/requireSeller.js";
import {
  handleListingImageUpload,
  optimizeListingImages,
} from "../middleware/listingImages.js";

const router = Router();

function aiErrorStatus(error) {
  return /not configured/i.test(error.message || "") ? 503 : 400;
}

router.post("/ai/draft", requireSeller, aiRateLimit, async (req, res) => {
  try {
    const draft = await draftServiceFromText({
      text: req.body?.text,
      category: req.body?.category,
      title: req.body?.title,
      description: req.body?.description,
    });
    res.json({ draft });
  } catch (error) {
    console.error("Service AI draft failed:", error);
    res.status(aiErrorStatus(error)).json({ error: error.message || "Failed to draft service" });
  }
});

router.post(
  "/ai/analyze-photos",
  requireSeller,
  aiRateLimit,
  handleListingImageUpload,
  optimizeListingImages,
  async (req, res) => {
    if (!req.files?.length) {
      return res.status(400).json({ error: "Upload at least one photo" });
    }

    try {
      res.json({ analysis: await analyzeServicePhotos(req.files) });
    } catch (error) {
      console.error("Service AI photo analysis failed:", error);
      res
        .status(aiErrorStatus(error))
        .json({ error: error.message || "Failed to analyze photos" });
    }
  },
);

router.post("/ai/capabilities", requireSeller, aiRateLimit, async (req, res) => {
  try {
    const suggestions = await suggestServiceCapabilities({
      category: req.body?.category,
      title: req.body?.title,
      description: req.body?.description,
      existing: req.body?.existing,
    });
    res.json({ suggestions });
  } catch (error) {
    console.error("Service AI capabilities failed:", error);
    res
      .status(aiErrorStatus(error))
      .json({ error: error.message || "Failed to suggest capabilities" });
  }
});

router.post("/ai/quality-check", requireSeller, aiRateLimit, async (req, res) => {
  try {
    res.json({ issues: await checkServiceQuality(req.body?.form) });
  } catch (error) {
    console.error("Service AI quality check failed:", error);
    res.status(aiErrorStatus(error)).json({ error: error.message || "Failed to check listing" });
  }
});

const SERVICE_WHERE = { listingType: "SERVICE" };

const sellerSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
};

function findOwnService(id, sellerId) {
  return prisma.product.findFirst({
    where: { id, sellerId, ...SERVICE_WHERE },
  });
}

router.post("/", requireSeller, handleListingImageUpload, optimizeListingImages, async (req, res) => {
  let uploadedImageUrls = [];

  try {
    const payload = parseServicePayload(req.body);
    payload.location = await withSellerCoordinates(payload.location, req.sellerId);

    const service = await prisma.product.create({
      data: {
        sellerId: req.sellerId,
        listingType: "SERVICE",
        ...payload,
        images: [],
      },
    });

    if (!req.files?.length) {
      return res.status(201).json({ service: await formatService(service) });
    }

    uploadedImageUrls = await uploadImagesToS3(
      "services",
      payload.category,
      service.id,
      req.files,
    );

    const updated = await prisma.product.update({
      where: { id: service.id },
      data: { images: uploadedImageUrls },
    });

    res.status(201).json({ service: await formatService(updated) });
  } catch (error) {
    if (uploadedImageUrls.length) {
      try {
        await deleteImagesFromS3(uploadedImageUrls);
      } catch (cleanupError) {
        console.error("Failed to clean up S3 images after service create error:", cleanupError);
      }
    }

    console.error("Create service failed:", error);
    res.status(400).json({ error: error.message || "Failed to create service" });
  }
});

router.get("/mine", requireSeller, async (req, res) => {
  try {
    const services = await prisma.product.findMany({
      where: { sellerId: req.sellerId, ...SERVICE_WHERE },
      orderBy: { createdAt: "desc" },
    });

    const serviceIds = services.map((service) => service.id);
    const inquiryCountById = new Map();

    if (serviceIds.length) {
      const inquiryGroups = await prisma.conversation.groupBy({
        by: ["productId"],
        where: { productId: { in: serviceIds } },
        _count: { _all: true },
      });

      for (const group of inquiryGroups) {
        inquiryCountById.set(group.productId, group._count._all);
      }
    }

    const formatted = await Promise.all(
      services.map(async (service) => ({
        ...(await formatService(service)),
        inquiryCount: inquiryCountById.get(service.id) ?? 0,
      })),
    );

    res.json({
      services: formatted,
      stats: {
        activeServices: services.filter((service) => isActiveListing(service)).length,
        totalViews: services.reduce((sum, service) => sum + (service.viewCount ?? 0), 0),
        totalInquiries: [...inquiryCountById.values()].reduce((sum, count) => sum + count, 0),
      },
    });
  } catch (error) {
    console.error("List services failed:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.get("/categories", requireAuth, async (_req, res) => {
  try {
    res.json({ categories: await listServiceCategoriesWithCounts() });
  } catch (error) {
    console.error("List service categories failed:", error);
    res.status(500).json({ error: "Failed to fetch service categories" });
  }
});

router.get("/category-options", requireAuth, (_req, res) => {
  res.json({ categories: getServiceCategories() });
});

router.get("/browse", requireAuth, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = parseServiceCategory(req.query.category) || undefined;
    const city = String(req.query.city || "").trim();
    const state = String(req.query.state || "").trim();
    const serviceMode = parseServiceMode(req.query.serviceMode) || undefined;
    const sort = parseServiceSort(req.query.sort);
    const rawMaxPrice = req.query.maxPrice;
    const maxPrice =
      rawMaxPrice !== undefined && rawMaxPrice !== "" ? Number(rawMaxPrice) : undefined;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const services = await prisma.product.findMany({
      where: buildServiceBrowseWhere({
        search,
        category,
        city,
        state,
        serviceMode,
        sort,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      }),
      include: { seller: { select: sellerSelect } },
      orderBy: buildServiceOrderBy(sort),
      take: limit,
      skip,
    });

    res.json({
      services: await Promise.all(
        services.map((service) => formatServiceListing(service, service.seller)),
      ),
    });
  } catch (error) {
    console.error("Browse services failed:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.get("/browse/:id/similar", requireAuth, async (req, res) => {
  try {
    const service = await prisma.product.findFirst({
      where: { id: req.params.id, ...ACTIVE_SERVICE_WHERE },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 12);

    const similar = await prisma.product.findMany({
      where: {
        ...ACTIVE_SERVICE_WHERE,
        category: service.category,
        id: { not: service.id },
      },
      include: { seller: { select: sellerSelect } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({
      services: await Promise.all(
        similar.map((item) => formatServiceListing(item, item.seller)),
      ),
    });
  } catch (error) {
    console.error("Similar services failed:", error);
    res.status(500).json({ error: "Failed to fetch similar services" });
  }
});

router.get("/browse/:id", requireAuth, async (req, res) => {
  try {
    const service = await prisma.product.findFirst({
      where: { id: req.params.id, ...ACTIVE_SERVICE_WHERE },
      include: { seller: { select: sellerSelect } },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (req.user.id !== service.sellerId) {
      const updated = await prisma.product.update({
        where: { id: service.id },
        data: { viewCount: { increment: 1 } },
      });
      service.viewCount = updated.viewCount;
    }

    const [inquiryCount, savedCount] = await Promise.all([
      prisma.conversation.count({ where: { productId: service.id } }),
      prisma.savedListing.count({ where: { productId: service.id } }),
    ]);

    res.json({
      service: {
        ...(await formatServiceListing(service, service.seller)),
        inquiryCount,
        savedCount,
      },
    });
  } catch (error) {
    console.error("Browse service failed:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
});

router.get("/:id", requireSeller, async (req, res) => {
  try {
    const service = await findOwnService(req.params.id, req.sellerId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const inquiryCount = await prisma.conversation.count({
      where: { productId: service.id },
    });

    res.json({ service: { ...(await formatService(service)), inquiryCount } });
  } catch (error) {
    console.error("Get service failed:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
});

router.patch("/:id/status", requireSeller, async (req, res) => {
  try {
    const existing = await findOwnService(req.params.id, req.sellerId);

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (getListingStatus(existing) === "DELETED") {
      return res.status(400).json({ error: "Deleted services cannot change status" });
    }

    const listingStatus = parseServiceStatus(req.body.listingStatus);
    if (!listingStatus) {
      return res.status(400).json({ error: "listingStatus must be active or paused" });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: { listingStatus },
    });

    res.json({ service: await formatService(updated) });
  } catch (error) {
    console.error("Update service status failed:", error);
    res.status(400).json({ error: error.message || "Failed to update service status" });
  }
});

router.patch("/:id", requireSeller, handleListingImageUpload, optimizeListingImages, async (req, res) => {
  try {
    const existing = await findOwnService(req.params.id, req.sellerId);

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (getListingStatus(existing) === "DELETED") {
      return res.status(400).json({ error: "Deleted services cannot be edited" });
    }

    const payload = parseServicePayload(serviceBodyWithFallback(req.body, existing));
    payload.location = await withSellerCoordinates(payload.location, req.sellerId);

    const updateData = { ...payload };
    const clearImages = String(req.body.clearImages || "") === "true";

    if (req.files?.length || clearImages) {
      await deleteImagesFromS3(existing.images);
      updateData.images = req.files?.length
        ? await uploadImagesToS3("services", payload.category, existing.id, req.files)
        : [];
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: updateData,
    });

    res.json({ service: await formatService(updated) });
  } catch (error) {
    console.error("Update service failed:", error);
    res.status(400).json({ error: error.message || "Failed to update service" });
  }
});

router.delete("/:id", requireSeller, async (req, res) => {
  try {
    const existing = await findOwnService(req.params.id, req.sellerId);

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (getListingStatus(existing) === "DELETED") {
      return res.status(400).json({ error: "Service is already deleted" });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: { listingStatus: "DELETED" },
    });

    res.json({ service: await formatService(updated), message: "Service deleted" });
  } catch (error) {
    console.error("Delete service failed:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

export default router;
