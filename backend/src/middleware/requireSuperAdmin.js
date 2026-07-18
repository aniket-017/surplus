import { prisma } from "../lib/prisma.js";

export async function requireSuperAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
        isBanned: true,
      },
    });

    if (!user || !user.isSuperAdmin || user.isBanned) {
      return res.status(403).json({ error: "Superadmin access required" });
    }

    req.superAdmin = user;
    next();
  } catch (error) {
    console.error("requireSuperAdmin failed:", error);
    res.status(500).json({ error: "Failed to verify superadmin access" });
  }
}
