import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { analyzeProductImages } from "../lib/gemini.js";
import {
  cleanupTempFiles,
  deleteProductImages,
  moveImagesToProductFolder,
  uploadProductImages,
} from "../lib/upload.js";
import { formatProduct, parseProductPayload } from "../lib/product.js";
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

router.post("/analyze", requireSeller, handleUpload, async (req, res) => {
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
  } finally {
    cleanupTempFiles(req.files);
  }
});

router.post("/", requireSeller, handleUpload, async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: "At least one image is required" });
  }

  try {
    const payload = parseProductPayload(req.body);

    const product = await prisma.product.create({
      data: {
        sellerId: req.sellerId,
        ...payload,
        images: [],
      },
    });

    const imageUrls = moveImagesToProductFolder(product.id, req.files);

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { images: imageUrls },
    });

    res.status(201).json({ product: formatProduct(updated) });
  } catch (error) {
    cleanupTempFiles(req.files);
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

    res.json({ products: products.map(formatProduct) });
  } catch (error) {
    console.error("List products failed:", error);
    res.status(500).json({ error: "Failed to fetch products" });
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

    res.json({ product: formatProduct(product) });
  } catch (error) {
    console.error("Get product failed:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.patch("/:id", requireSeller, handleUpload, async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, sellerId: req.sellerId },
    });

    if (!existing) {
      cleanupTempFiles(req.files);
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
      deleteProductImages(existing.images);
      updateData.images = moveImagesToProductFolder(existing.id, req.files);
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: updateData,
    });

    res.json({ product: formatProduct(updated) });
  } catch (error) {
    cleanupTempFiles(req.files);
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

    deleteProductImages(existing.images);

    await prisma.product.delete({ where: { id: existing.id } });

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product failed:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
