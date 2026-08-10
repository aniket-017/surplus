import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  ensureCategoryMeta,
  getAllowedCategories,
  listCategoriesWithCounts,
  listSubCategoriesForCategory,
} from "../lib/category.js";
import { analyzeProductImages } from "../lib/gemini.js";
import { optimizeProductImage } from "../lib/imageOptimize.js";
import {
  deleteProductImages as deleteProductImagesFromS3,
  uploadProductImages as uploadProductImagesToS3,
} from "../lib/s3.js";
import { uploadProductImages } from "../lib/upload.js";
import {
  ACTIVE_LISTING_WHERE,
  buildBrowseOrderBy,
  buildBrowseWhere,
  formatProduct,
  formatProductListing,
  formatSellerProducts,
  getListingStatus,
  isActiveListing,
  parseBrowseSort,
  parseCondition,
  parseListingStatus,
  parseProductPayload,
} from "../lib/product.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSeller } from "../middleware/requireSeller.js";
import { createLogger, describeUploadFile } from "../lib/logger.js";

const router = Router();
const analyzeLog = createLogger("product-analyze");

function handleUpload(req, res, next) {
  uploadProductImages(req, res, (error) => {
    if (error) {
      analyzeLog.error("Multer upload failed", error);
      return res.status(400).json({ error: error.message || "Invalid image upload" });
    }

    analyzeLog.info("Images received by multer", {
      count: req.files?.length ?? 0,
      images: req.files?.map((file, index) => describeUploadFile(file, index)) ?? [],
    });
    next();
  });
}

async function optimizeUploadedImages(req, res, next) {
  try {
    if (req.files?.length) {
      req.files = await Promise.all(
        req.files.map((file, index) => optimizeProductImage(file, index)),
      );
      analyzeLog.info("Images ready after optimization", {
        count: req.files.length,
        images: req.files.map((file, index) => describeUploadFile(file, index)),
      });
    }
    next();
  } catch (error) {
    analyzeLog.error("Image optimization middleware failed", error);
    res.status(400).json({ error: error.message || "Failed to process images" });
  }
}

router.post("/analyze", requireSeller, (req, res, next) => {
  analyzeLog.info("Analyze request hitting upload middleware", {
    sellerId: req.sellerId,
    contentType: req.headers["content-type"],
  });
  next();
}, handleUpload, optimizeUploadedImages, async (req, res) => {
  analyzeLog.info("Analyze request received", {
    sellerId: req.sellerId,
    imageCount: req.files?.length ?? 0,
  });

  if (!req.files?.length) {
    analyzeLog.warn("Analyze request rejected: no images uploaded");
    return res.status(400).json({ error: "At least one image is required" });
  }

  try {
    const analysis = await analyzeProductImages(req.files);
    analyzeLog.info("Analyze request completed successfully", {
      sellerId: req.sellerId,
      title: analysis.title,
      category: analysis.category,
    });
    res.json({ analysis });
  } catch (error) {
    analyzeLog.error("Analyze request failed", error);
    res.status(500).json({
      error: error.message || "Failed to analyze product images",
    });
  }
});

router.post("/", requireSeller, handleUpload, optimizeUploadedImages, async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: "At least one image is required" });
  }

  let uploadedImageUrls = [];

  try {
    const payload = parseProductPayload(req.body);

    await ensureCategoryMeta(payload.category);

    const product = await prisma.product.create({
      data: {
        sellerId: req.sellerId,
        ...payload,
        images: [],
      },
    });

    uploadedImageUrls = await uploadProductImagesToS3(
      payload.category,
      payload.subCategory,
      product.id,
      req.files,
    );

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { images: uploadedImageUrls },
    });

    res.status(201).json({ product: await formatProduct(updated) });
  } catch (error) {
    if (uploadedImageUrls.length) {
      try {
        await deleteProductImagesFromS3(uploadedImageUrls);
      } catch (cleanupError) {
        console.error("Failed to clean up S3 images after create error:", cleanupError);
      }
    }

    console.error("Create product failed:", error);
    res.status(400).json({ error: error.message || "Failed to create product" });
  }
});

router.get("/mine", requireSeller, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.sellerId },
      orderBy: { createdAt: "desc" },
    });

    const productIds = products.map((product) => product.id);
    const inquiryCountByProductId = new Map();

    if (productIds.length) {
      const inquiryGroups = await prisma.conversation.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds } },
        _count: { _all: true },
      });

      for (const group of inquiryGroups) {
        inquiryCountByProductId.set(group.productId, group._count._all);
      }
    }

    const formattedProducts = await formatSellerProducts(products, inquiryCountByProductId);
    const totalViews = products.reduce((sum, product) => sum + (product.viewCount ?? 0), 0);
    const totalInquiries = [...inquiryCountByProductId.values()].reduce(
      (sum, count) => sum + count,
      0,
    );
    const activeListings = products.filter((product) => isActiveListing(product)).length;

    res.json({
      products: formattedProducts,
      stats: {
        activeListings,
        totalViews,
        totalInquiries,
      },
    });
  } catch (error) {
    console.error("List products failed:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/categories", requireAuth, async (_req, res) => {
  try {
    const categories = await listCategoriesWithCounts();

    res.json({ categories });
  } catch (error) {
    console.error("List categories failed:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/category-options", requireAuth, async (_req, res) => {
  try {
    res.json({ categories: getAllowedCategories() });
  } catch (error) {
    console.error("List category options failed:", error);
    res.status(500).json({ error: "Failed to fetch category options" });
  }
});

router.get("/subcategories", requireAuth, async (req, res) => {
  try {
    const category = String(req.query.category || "").trim();
    const subCategories = await listSubCategoriesForCategory(category);
    res.json({ subCategories });
  } catch (error) {
    console.error("List subcategories failed:", error);
    res.status(500).json({ error: "Failed to fetch subcategories" });
  }
});

const sellerSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
};

router.get("/browse", requireAuth, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const subCategory = String(req.query.subCategory || "").trim();
    const city = String(req.query.city || "").trim();
    const state = String(req.query.state || "").trim();
    const sort = parseBrowseSort(req.query.sort);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const rawMinPrice = req.query.minPrice;
    const rawMaxPrice = req.query.maxPrice;
    const minPrice =
      rawMinPrice !== undefined && rawMinPrice !== ""
        ? Number(rawMinPrice)
        : undefined;
    const maxPrice =
      rawMaxPrice !== undefined && rawMaxPrice !== ""
        ? Number(rawMaxPrice)
        : undefined;

    const condition = parseCondition(req.query.condition);
    const negotiableRaw = String(req.query.negotiable || "")
      .trim()
      .toLowerCase();
    const negotiable = negotiableRaw === "true" || negotiableRaw === "1";

    const where = buildBrowseWhere({
      search,
      category,
      subCategory,
      city,
      state,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      condition: condition || undefined,
      negotiable,
    });

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: sellerSelect,
        },
      },
      orderBy: buildBrowseOrderBy(sort),
      take: limit,
      skip,
    });

    res.json({
      products: await Promise.all(
        products.map((product) => formatProductListing(product, product.seller)),
      ),
    });
  } catch (error) {
    console.error("Browse products failed:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/browse/:id/stats", requireAuth, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, ...ACTIVE_LISTING_WHERE },
      select: { id: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [inquiryCount, savedCount] = await Promise.all([
      prisma.conversation.count({ where: { productId: req.params.id } }),
      prisma.savedListing.count({ where: { productId: req.params.id } }),
    ]);

    res.json({ inquiryCount, savedCount });
  } catch (error) {
    console.error("Product stats failed:", error);
    res.status(500).json({ error: "Failed to fetch product stats" });
  }
});

router.get("/browse/:id/similar", requireAuth, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, ...ACTIVE_LISTING_WHERE },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 12);

    const similar = await prisma.product.findMany({
      where: {
        ...ACTIVE_LISTING_WHERE,
        category: product.category,
        subCategory: product.subCategory,
        id: { not: product.id },
      },
      include: {
        seller: { select: sellerSelect },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({
      products: await Promise.all(
        similar.map((item) => formatProductListing(item, item.seller)),
      ),
    });
  } catch (error) {
    console.error("Similar products failed:", error);
    res.status(500).json({ error: "Failed to fetch similar products" });
  }
});

router.get("/browse/:id", requireAuth, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: sellerSelect,
        },
      },
    });

    if (!product || !isActiveListing(product)) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (req.user.id !== product.sellerId) {
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      });
      product.viewCount = updated.viewCount;
    }

    res.json({ product: await formatProductListing(product, product.seller) });
  } catch (error) {
    console.error("Browse product failed:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.get("/:id", requireSeller, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: req.sellerId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: await formatProduct(product) });
  } catch (error) {
    console.error("Get product failed:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.patch("/:id/status", requireSeller, async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: req.sellerId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (getListingStatus(existing) === "DELETED") {
      return res.status(400).json({ error: "Deleted listings cannot change status" });
    }

    const listingStatus = parseListingStatus(req.body.listingStatus);
    if (!listingStatus || listingStatus === "DELETED") {
      return res.status(400).json({ error: "listingStatus must be active or sold" });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: { listingStatus },
    });

    res.json({ product: await formatProduct(updated) });
  } catch (error) {
    console.error("Update product status failed:", error);
    res.status(400).json({ error: error.message || "Failed to update product status" });
  }
});

router.patch("/:id", requireSeller, handleUpload, optimizeUploadedImages, async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: req.sellerId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (getListingStatus(existing) === "DELETED") {
      return res.status(400).json({ error: "Deleted listings cannot be edited" });
    }

    const payload = parseProductPayload({
      title: req.body.title ?? existing.title,
      category: req.body.category ?? existing.category,
      subCategory: req.body.subCategory ?? existing.subCategory,
      description: req.body.description ?? existing.description,
      quantity: req.body.quantity ?? existing.quantity,
      quantityUnit: req.body.quantityUnit ?? existing.quantityUnit,
      price: req.body.price ?? existing.price,
      priceType: req.body.priceType ?? existing.priceType,
      condition: req.body.condition ?? existing.condition,
      attributes: req.body.attributes ?? existing.attributes,
      location: req.body.location ?? existing.location,
    });

    await ensureCategoryMeta(payload.category);

    const updateData = { ...payload };

    if (req.files?.length) {
      await deleteProductImagesFromS3(existing.images);
      updateData.images = await uploadProductImagesToS3(
        payload.category,
        payload.subCategory,
        existing.id,
        req.files,
      );
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: updateData,
    });

    res.json({ product: await formatProduct(updated) });
  } catch (error) {
    console.error("Update product failed:", error);
    res.status(400).json({ error: error.message || "Failed to update product" });
  }
});

router.delete("/:id", requireSeller, async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: req.sellerId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (getListingStatus(existing) === "DELETED") {
      return res.status(400).json({ error: "Product is already deleted" });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: { listingStatus: "DELETED" },
    });

    res.json({ product: await formatProduct(updated), message: "Product deleted" });
  } catch (error) {
    console.error("Delete product failed:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
