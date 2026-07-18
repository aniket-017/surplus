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
import { formatMessage } from "../lib/conversations.js";
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

function formatLastMessagePreview(message) {
  if (!message) return null;

  const body = message.body?.trim();
  if (body) return body;
  if (message.imageUrl) return "Photo";
  if (message.fileUrl) return message.fileName || "Document";
  return "Inquiry sent";
}

async function deleteConversationsByIds(conversationIds) {
  if (!conversationIds.length) {
    return 0;
  }

  await prisma.message.deleteMany({
    where: { conversationId: { in: conversationIds } },
  });
  const result = await prisma.conversation.deleteMany({
    where: { id: { in: conversationIds } },
  });

  return result.count;
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

  await deleteConversationsByIds(conversationIds);

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

router.get("/users/:id/conversations", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { page, limit, skip } = parsePagination(req.query);
    const q = String(req.query.q || "").trim();

    const where = {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
      ...(q
        ? {
            AND: [
              {
                OR: [
                  { product: { title: { contains: q } } },
                  { buyer: { email: { contains: q } } },
                  { buyer: { name: { contains: q } } },
                  { seller: { email: { contains: q } } },
                  { seller: { name: { contains: q } } },
                ],
              },
            ],
          }
        : {}),
    };

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limit,
        include: {
          buyer: {
            select: { id: true, email: true, name: true },
          },
          seller: {
            select: { id: true, email: true, name: true },
          },
          product: {
            select: { id: true, title: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              body: true,
              imageUrl: true,
              fileUrl: true,
              fileName: true,
              createdAt: true,
              senderId: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
    ]);

    res.json({
      page,
      limit,
      total,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ? user.role.toLowerCase() : null,
      },
      conversations: conversations.map((conversation) => {
        const isBuyer = conversation.buyerId === user.id;
        const counterpart = isBuyer ? conversation.seller : conversation.buyer;
        const lastMessage = conversation.messages[0] || null;

        return {
          id: conversation.id,
          product: conversation.product,
          counterpart,
          userRoleInChat: isBuyer ? "buyer" : "seller",
          buyer: conversation.buyer,
          seller: conversation.seller,
          lastMessagePreview: formatLastMessagePreview(lastMessage),
          lastMessageAt: conversation.lastMessageAt,
          messageCount: conversation._count.messages,
          createdAt: conversation.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("Superadmin list user conversations failed:", error);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.delete("/users/:id/conversations", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);
    const deletedCount = await deleteConversationsByIds(conversationIds);

    res.json({
      message: "User chats cleared",
      deletedCount,
    });
  } catch (error) {
    console.error("Superadmin clear user conversations failed:", error);
    res.status(500).json({ error: "Failed to clear user chats" });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: {
          select: { id: true, email: true, name: true },
        },
        seller: {
          select: { id: true, email: true, name: true },
        },
        product: {
          select: { id: true, title: true },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [total, messagesDesc] = await Promise.all([
      prisma.message.count({ where: { conversationId: conversation.id } }),
      prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
    ]);

    // Return chronological order (oldest → newest) within the page.
    const messages = [...messagesDesc].reverse();

    const formattedMessages = await Promise.all(
      messages.map(async (message) => {
        const formatted = await formatMessage(message);
        return {
          ...formatted,
          sender: message.sender,
        };
      }),
    );

    res.json({
      page,
      limit,
      total,
      hasMore: skip + messagesDesc.length < total,
      conversation: {
        id: conversation.id,
        product: conversation.product,
        buyer: conversation.buyer,
        seller: conversation.seller,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
      },
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Superadmin list conversation messages failed:", error);
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await deleteConversationsByIds([conversation.id]);

    res.json({ message: "Conversation cleared" });
  } catch (error) {
    console.error("Superadmin clear conversation failed:", error);
    res.status(500).json({ error: "Failed to clear conversation" });
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
