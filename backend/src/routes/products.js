import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { analyzeProductImages } from "../lib/gemini.js";
import { optimizeProductImage } from "../lib/imageOptimize.js";
import {
  deleteProductImages as deleteProductImagesFromS3,
  uploadProductImages as uploadProductImagesToS3,
} from "../lib/s3.js";
import { uploadProductImages } from "../lib/upload.js";
import {
  buildBrowseOrderBy,
  buildBrowseWhere,
  formatProduct,
  formatProductListing,
  parseBrowseSort,
  parseProductPayload,
} from "../lib/product.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSeller } from "../middleware/requireSeller.js";

const router = Router();

function handleUpload(req, res, next) {
  uploadProductImages(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || "Invalid image upload" });
    }
    next();
  });
}

async function optimizeUploadedImages(req, res, next) {
  try {
    if (req.files?.length) {
      req.files = await Promise.all(req.files.map(optimizeProductImage));
    }
    next();
  } catch (error) {
    console.error("Image optimization failed:", error);
    res.status(400).json({ error: error.message || "Failed to process images" });
  }
}

router.post("/analyze", requireSeller, handleUpload, optimizeUploadedImages, async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: "At least one image is required" });
  }

  try {
    const analysis = await analyzeProductImages(req.files);
    res.json({ analysis });
  } catch (error) {
    console.error("Product analyze failed:", error);
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

    res.json({ products: await Promise.all(products.map(formatProduct)) });
  } catch (error) {
    console.error("List products failed:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/categories", requireAuth, async (_req, res) => {
  try {
    const grouped = await prisma.product.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { category: "asc" },
    });

    res.json({
      categories: grouped.map((item) => ({
        name: item.category,
        count: item._count.category,
      })),
    });
  } catch (error) {
    console.error("List categories failed:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/browse", requireAuth, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const sort = parseBrowseSort(req.query.sort);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const where = buildBrowseWhere({ search, category });

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
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

router.get("/browse/:id", requireAuth, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
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

router.patch("/:id", requireSeller, handleUpload, optimizeUploadedImages, async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: req.sellerId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
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

    await deleteProductImagesFromS3(existing.images);

    await prisma.product.delete({ where: { id: existing.id } });

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product failed:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
