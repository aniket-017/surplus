import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { clearAuthCookie } from "../lib/auth.js";

export async function requireAuth(req, res, next) {
  const token =
    req.cookies?.token ??
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isDeleted: true,
        isSuperAdmin: true,
        isBanned: true,
      },
    });

    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (user.isDeleted) {
      clearAuthCookie(res);
      return res.status(410).json({ error: "This account has been permanently deleted" });
    }

    if (user.isBanned) {
      clearAuthCookie(res);
      return res.status(403).json({ error: "This account has been banned" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role ? user.role.toLowerCase() : null,
      isSuperAdmin: Boolean(user.isSuperAdmin),
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
