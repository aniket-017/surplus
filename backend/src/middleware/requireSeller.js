import { prisma } from "../lib/prisma.js";
import { requireAuth } from "./auth.js";

export async function requireSeller(req, res, next) {
  requireAuth(req, res, async (authError) => {
    if (authError) return;

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, role: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "SELLER") {
        return res.status(403).json({ error: "Seller access required" });
      }

      req.sellerId = user.id;
      next();
    } catch (error) {
      console.error("requireSeller failed:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
