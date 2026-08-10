import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const REPORT_REASONS = ["SPAM", "MISLEADING", "PROHIBITED", "WRONG_CATEGORY", "OTHER"];

router.post("/", requireAuth, async (req, res) => {
  try {
    const productId = String(req.body.productId || "").trim();
    const reason = String(req.body.reason || "")
      .trim()
      .toUpperCase();
    const details = String(req.body.details || "").trim() || null;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ error: "Valid report reason is required" });
    }

    if (reason === "OTHER" && !details) {
      return res.status(400).json({ error: "Please provide details for this report" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true, listingStatus: true },
    });

    if (!product || product.listingStatus === "DELETED") {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.sellerId === req.user.id) {
      return res.status(400).json({ error: "You cannot report your own listing" });
    }

    const existing = await prisma.listingReport.findUnique({
      where: {
        reporterId_productId: {
          reporterId: req.user.id,
          productId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "You have already reported this listing" });
    }

    const report = await prisma.listingReport.create({
      data: {
        reporterId: req.user.id,
        productId,
        reason,
        details,
        status: "OPEN",
      },
      select: {
        id: true,
        productId: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json({ report });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "You have already reported this listing" });
    }

    console.error("Create listing report failed:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
