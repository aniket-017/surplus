import { Router } from "express";
import { isOtpAuthEnabled } from "../config/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  setAuthCookie,
  formatUser,
  userSelect,
} from "../lib/auth.js";
import { sendOtpEmail } from "../lib/mail.js";
import { generateOtp, hashOtp, getOtpExpiry, isValidEmail } from "../lib/otp.js";
import { deleteProductImages as deleteProductImagesFromS3 } from "../lib/s3.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin.js";

const router = Router();

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, Number.parseInt(query.limit, 10) || PAGE_SIZE_DEFAULT),
  );
  return { page, limit, skip: (page - 1) * limit };
}

async function deleteProductWithRelations(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return null;
  }

  const conversations = await prisma.conversation.findMany({
    where: { productId },
    select: { id: true },
  });
  const conversationIds = conversations.map((c) => c.id);

  if (conversationIds.length) {
    await prisma.message.deleteMany({
      where: { conversationId: { in: conversationIds } },
    });
    await prisma.conversation.deleteMany({
      where: { id: { in: conversationIds } },
    });
  }

  await prisma.savedListing.deleteMany({ where: { productId } });
  await deleteProductImagesFromS3(product.images);
  await prisma.product.delete({ where: { id: productId } });

  return product;
}

if (isOtpAuthEnabled()) {
  router.post("/otp/send", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, isSuperAdmin: true, isBanned: true },
      });

      if (!user?.isSuperAdmin) {
        return res.status(403).json({
          error: "No superadmin account found for this email.",
        });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: "This account has been banned" });
      }

      const otp = generateOtp();

      await prisma.otp.deleteMany({ where: { email } });
      await prisma.otp.create({
        data: {
          email,
          code: hashOtp(email, otp),
          expiresAt: getOtpExpiry(),
        },
      });

      await sendOtpEmail(email, otp);

      res.json({ message: "OTP sent to your email" });
    } catch (error) {
      console.error("Superadmin OTP send failed:", error);

      if (error.code === "EAUTH") {
        return res.status(503).json({
          error:
            "Email service authentication failed. Regenerate your Gmail App Password and update SMTP_PASSWORD in backend/.env, then restart the server.",
        });
      }

      res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }
  });

  router.post("/otp/verify", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const code = req.body.otp?.trim();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Valid 6-digit OTP is required" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: userSelect,
      });

      if (!user?.isSuperAdmin) {
        return res.status(403).json({
          error: "No superadmin account found for this email.",
        });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: "This account has been banned" });
      }

      const record = await prisma.otp.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
      });

      if (!record) {
        return res.status(400).json({ error: "OTP not found. Request a new one." });
      }

      if (record.expiresAt < new Date()) {
        await prisma.otp.delete({ where: { id: record.id } });
        return res.status(400).json({ error: "OTP expired. Request a new one." });
      }

      if (record.code !== hashOtp(email, code)) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      await prisma.otp.deleteMany({ where: { email } });

      const token = setAuthCookie(res, user);

      res.json({
        message: "Signed in successfully",
        token,
        user: formatUser(user),
      });
    } catch (error) {
      console.error("Superadmin OTP verify failed:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });
}

router.use(requireAuth, requireSuperAdmin);

router.get("/overview", async (_req, res) => {
  try {
    const [
      users,
      buyers,
      sellers,
      banned,
      superadmins,
      products,
      conversations,
      messages,
      recentUsers,
      recentProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.user.count({ where: { role: "SELLER" } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { isSuperAdmin: true } }),
      prisma.product.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBanned: true,
          isSuperAdmin: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          createdAt: true,
          seller: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
    ]);

    res.json({
      stats: {
        users,
        buyers,
        sellers,
        banned,
        superadmins,
        products,
        conversations,
        messages,
      },
      recentUsers: recentUsers.map((user) => ({
        ...user,
        role: user.role ? user.role.toLowerCase() : null,
      })),
      recentProducts,
    });
  } catch (error) {
    console.error("Superadmin overview failed:", error);
    res.status(500).json({ error: "Failed to load overview" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const q = String(req.query.q || "").trim();

    const where = q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isSuperAdmin: true,
          isBanned: true,
          bannedAt: true,
          bannedReason: true,
          createdAt: true,
          _count: {
            select: { products: true },
          },
        },
      }),
    ]);

    res.json({
      page,
      limit,
      total,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ? user.role.toLowerCase() : null,
        isSuperAdmin: user.isSuperAdmin,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt,
        bannedReason: user.bannedReason,
        createdAt: user.createdAt,
        productCount: user._count.products,
      })),
    });
  } catch (error) {
    console.error("Superadmin list users failed:", error);
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.post("/users/:id/ban", async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
        isBanned: true,
      },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    if (target.id === req.user.id) {
      return res.status(400).json({ error: "You cannot ban yourself" });
    }

    if (target.isSuperAdmin) {
      return res.status(400).json({
        error: "Cannot ban a superadmin. Revoke superadmin access first.",
      });
    }

    const reason = String(req.body.reason || "").trim() || null;

    const user = await prisma.user.update({
      where: { id: target.id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason,
      },
      select: userSelect,
    });

    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Superadmin ban user failed:", error);
    res.status(500).json({ error: "Failed to ban user" });
  }
});

router.post("/users/:id/unban", async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await prisma.user.update({
      where: { id: target.id },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
      },
      select: userSelect,
    });

    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Superadmin unban user failed:", error);
    res.status(500).json({ error: "Failed to unban user" });
  }
});

router.get("/products", async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const q = String(req.query.q || "").trim();

    const where = q
      ? {
          OR: [
            { title: { contains: q } },
            { category: { contains: q } },
            { seller: { email: { contains: q } } },
          ],
        }
      : {};

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          category: true,
          subCategory: true,
          price: true,
          priceType: true,
          quantity: true,
          quantityUnit: true,
          viewCount: true,
          createdAt: true,
          seller: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
    ]);

    res.json({ page, limit, total, products });
  } catch (error) {
    console.error("Superadmin list products failed:", error);
    res.status(500).json({ error: "Failed to list products" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const deleted = await deleteProductWithRelations(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Superadmin delete product failed:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

router.get("/admins", async (_req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    res.json({ admins });
  } catch (error) {
    console.error("Superadmin list admins failed:", error);
    res.status(500).json({ error: "Failed to list superadmins" });
  }
});

router.post("/admins", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  try {
    const admin = await prisma.user.upsert({
      where: { email },
      update: { isSuperAdmin: true },
      create: {
        email,
        isSuperAdmin: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        isSuperAdmin: true,
      },
    });

    res.status(201).json({ admin });
  } catch (error) {
    console.error("Superadmin create admin failed:", error);
    res.status(500).json({ error: "Failed to add superadmin" });
  }
});

router.delete("/admins/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "You cannot revoke your own superadmin access" });
    }

    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, isSuperAdmin: true },
    });

    if (!target?.isSuperAdmin) {
      return res.status(404).json({ error: "Superadmin not found" });
    }

    const superadminCount = await prisma.user.count({
      where: { isSuperAdmin: true },
    });

    if (superadminCount <= 1) {
      return res.status(400).json({ error: "Cannot remove the last superadmin" });
    }

    await prisma.user.update({
      where: { id: target.id },
      data: { isSuperAdmin: false },
    });

    res.json({ message: "Superadmin access revoked" });
  } catch (error) {
    console.error("Superadmin revoke admin failed:", error);
    res.status(500).json({ error: "Failed to revoke superadmin" });
  }
});

export default router;
