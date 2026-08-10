import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { formatProductListing, isActiveListing } from "../lib/product.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const saved = await prisma.savedListing.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const products = await Promise.all(
      saved
        .filter((item) => item.product && isActiveListing(item.product))
        .map((item) => formatProductListing(item.product, item.product.seller)),
    );

    res.json({ products });
  } catch (error) {
    console.error("List saved listings failed:", error);
    res.status(500).json({ error: "Failed to fetch saved listings" });
  }
});

router.get("/:productId/status", requireAuth, async (req, res) => {
  try {
    const saved = await prisma.savedListing.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: req.params.productId,
        },
      },
    });

    res.json({ saved: Boolean(saved) });
  } catch (error) {
    console.error("Saved status failed:", error);
    res.status(500).json({ error: "Failed to check saved status" });
  }
});

router.post("/:productId", requireAuth, async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, listingStatus: true },
    });

    if (!product || !isActiveListing(product)) {
      return res.status(404).json({ error: "Product not found" });
    }

    const existing = await prisma.savedListing.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.savedListing.delete({ where: { id: existing.id } });
      return res.json({ saved: false });
    }

    await prisma.savedListing.create({
      data: {
        userId: req.user.id,
        productId,
      },
    });

    res.json({ saved: true });
  } catch (error) {
    console.error("Toggle saved listing failed:", error);
    res.status(500).json({ error: "Failed to update saved listing" });
  }
});

export default router;
