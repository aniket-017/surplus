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
import {
  getFirebaseAuth,
  getFirebaseErrorCode,
  isFirebaseAuthConfigured,
} from "../lib/firebaseAdmin.js";
import { deleteProductImages as deleteProductImagesFromS3 } from "../lib/s3.js";
import { formatMessage } from "../lib/conversations.js";
import { notifyAdminAnnouncement } from "../lib/pushNotifications.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin.js";

const router = Router();

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;
const NOTIFICATION_TITLE_MAX = 80;
const NOTIFICATION_BODY_MAX = 500;
const NOTIFICATION_AUDIENCES = new Set(["ALL", "BUYERS", "SELLERS", "SPECIFIC"]);
const MONGO_OBJECT_ID_RE = /^[a-f\d]{24}$/i;

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
  await prisma.listingReport.deleteMany({ where: { productId } });
  await deleteProductImagesFromS3(product.images);
  await prisma.product.delete({ where: { id: productId } });

  return product;
}

async function deleteFirebaseUserIfPresent(firebaseUid) {
  if (!firebaseUid || !isFirebaseAuthConfigured()) {
    return;
  }

  try {
    await getFirebaseAuth().deleteUser(firebaseUid);
  } catch (error) {
    if (getFirebaseErrorCode(error) !== "auth/user-not-found") {
      console.error("Failed to delete Firebase user:", error);
    }
  }
}

async function deleteUserCompletely(user) {
  const products = await prisma.product.findMany({
    where: { sellerId: user.id },
    select: { id: true },
  });

  for (const product of products) {
    await deleteProductWithRelations(product.id);
  }

  const remainingConversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    },
    select: { id: true },
  });
  await deleteConversationsByIds(remainingConversations.map((c) => c.id));

  const createdNotifications = await prisma.notification.findMany({
    where: { createdById: user.id },
    select: { id: true },
  });
  const createdNotificationIds = createdNotifications.map((n) => n.id);

  if (createdNotificationIds.length) {
    await prisma.userNotification.deleteMany({
      where: { notificationId: { in: createdNotificationIds } },
    });
    await prisma.notification.deleteMany({
      where: { id: { in: createdNotificationIds } },
    });
  }

  await prisma.message.deleteMany({ where: { senderId: user.id } });
  await prisma.savedListing.deleteMany({ where: { userId: user.id } });
  await prisma.listingReport.deleteMany({ where: { reporterId: user.id } });
  await prisma.pushToken.deleteMany({ where: { userId: user.id } });
  await prisma.userNotification.deleteMany({ where: { userId: user.id } });

  if (user.email) {
    await prisma.otp.deleteMany({ where: { email: user.email } });
  }

  await prisma.user.delete({ where: { id: user.id } });
  await deleteFirebaseUserIfPresent(user.firebaseUid);
}

if (isOtpAuthEnabled()) {
  router.post("/otp/send", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    try {
      const user = await prisma.user.findFirst({
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
      const user = await prisma.user.findFirst({
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
      deleted,
      superadmins,
      products,
      conversations,
      messages,
      openReports,
      recentUsers,
      recentProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.user.count({ where: { role: "SELLER" } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { isDeleted: true } }),
      prisma.user.count({ where: { isSuperAdmin: true } }),
      prisma.product.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.listingReport.count({ where: { status: "OPEN" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isDeleted: true,
          deletedAt: true,
          deletedReason: true,
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
        deleted,
        superadmins,
        products,
        conversations,
        messages,
        openReports,
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
            { phone: { contains: q } },
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
          phone: true,
          name: true,
          role: true,
          isDeleted: true,
          deletedAt: true,
          deletedReason: true,
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
        phone: user.phone,
        name: user.name,
        role: user.role ? user.role.toLowerCase() : null,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
        deletedReason: user.deletedReason,
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

router.delete("/users/:id", async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firebaseUid: true,
        isSuperAdmin: true,
      },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    if (target.id === req.user.id) {
      return res.status(400).json({ error: "You cannot delete yourself" });
    }

    if (target.isSuperAdmin) {
      return res.status(400).json({
        error: "Cannot delete a superadmin. Revoke superadmin access first.",
      });
    }

    await deleteUserCompletely(target);

    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Superadmin delete user failed:", error);
    res.status(500).json({ error: "Failed to delete user" });
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

function serializeListingReport(report, reporter, product) {
  return {
    id: report.id,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    reporter: reporter || null,
    product: product || null,
  };
}

async function hydrateListingReports(reports) {
  const productIds = [...new Set(reports.map((report) => report.productId).filter(Boolean))];
  const reporterIds = [...new Set(reports.map((report) => report.reporterId).filter(Boolean))];

  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          title: true,
          category: true,
          listingStatus: true,
          sellerId: true,
        },
      })
    : [];

  const sellerIds = [...new Set(products.map((product) => product.sellerId).filter(Boolean))];
  const userIds = [...new Set([...reporterIds, ...sellerIds])];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true, phone: true },
      })
    : [];

  const usersById = new Map(users.map((user) => [user.id, user]));
  const productsById = new Map(
    products.map((product) => [
      product.id,
      {
        id: product.id,
        title: product.title,
        category: product.category,
        listingStatus: product.listingStatus,
        seller: usersById.get(product.sellerId) || null,
      },
    ]),
  );

  return reports.map((report) =>
    serializeListingReport(
      report,
      usersById.get(report.reporterId) || null,
      productsById.get(report.productId) || null,
    ),
  );
}

router.get("/reports", async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim().toUpperCase();

    const statusFilter =
      status && ["OPEN", "REVIEWED", "DISMISSED"].includes(status)
        ? { status }
        : {};

    const where = {
      ...statusFilter,
      ...(q
        ? {
            OR: [
              { details: { contains: q } },
              { product: { title: { contains: q } } },
              { product: { seller: { email: { contains: q } } } },
              { product: { seller: { name: { contains: q } } } },
              { reporter: { email: { contains: q } } },
              { reporter: { name: { contains: q } } },
            ],
          }
        : {}),
    };

    const [total, reports] = await Promise.all([
      prisma.listingReport.count({ where }),
      prisma.listingReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      page,
      limit,
      total,
      reports: await hydrateListingReports(reports),
    });
  } catch (error) {
    console.error("Superadmin list reports failed:", error);
    res.status(500).json({ error: "Failed to list reports" });
  }
});

router.patch("/reports/:id", async (req, res) => {
  try {
    const status = String(req.body.status || "")
      .trim()
      .toUpperCase();

    if (!["REVIEWED", "DISMISSED"].includes(status)) {
      return res.status(400).json({ error: "Status must be REVIEWED or DISMISSED" });
    }

    const existing = await prisma.listingReport.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Report not found" });
    }

    const report = await prisma.listingReport.update({
      where: { id: existing.id },
      data: { status },
    });

    const [hydrated] = await hydrateListingReports([report]);

    res.json({ report: hydrated });
  } catch (error) {
    console.error("Superadmin update report failed:", error);
    res.status(500).json({ error: "Failed to update report" });
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
    const existing = await prisma.user.findFirst({
      where: { email },
    });

    const admin = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { isSuperAdmin: true },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            isSuperAdmin: true,
          },
        })
      : await prisma.user.create({
          data: {
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

const REFERRAL_CODE_RE = /^[A-Z0-9_-]{3,32}$/;

function normalizeReferralCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase();
}

function formatReferralCode(item) {
  return {
    id: item.id,
    code: item.code,
    label: item.label ?? null,
    isActive: Boolean(item.isActive),
    userCount: item._count?.users ?? 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

router.get("/referral-codes", async (_req, res) => {
  try {
    const codes = await prisma.referralCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
      },
    });

    res.json({ referralCodes: codes.map(formatReferralCode) });
  } catch (error) {
    console.error("Superadmin list referral codes failed:", error);
    res.status(500).json({ error: "Failed to list referral codes" });
  }
});

router.post("/referral-codes", async (req, res) => {
  const code = normalizeReferralCode(req.body.code);
  const labelRaw =
    req.body.label !== undefined ? String(req.body.label || "").trim() : "";
  const label = labelRaw || null;

  if (!REFERRAL_CODE_RE.test(code)) {
    return res.status(400).json({
      error:
        "Referral code must be 3–32 characters (letters, numbers, underscore, or hyphen)",
    });
  }

  try {
    const existing = await prisma.referralCode.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ error: "This referral code already exists" });
    }

    const created = await prisma.referralCode.create({
      data: { code, label },
      include: {
        _count: { select: { users: true } },
      },
    });

    res.status(201).json({ referralCode: formatReferralCode(created) });
  } catch (error) {
    console.error("Superadmin create referral code failed:", error);

    if (error.code === "P2002") {
      return res.status(409).json({ error: "This referral code already exists" });
    }

    res.status(500).json({ error: "Failed to create referral code" });
  }
});

router.patch("/referral-codes/:id", async (req, res) => {
  if (!MONGO_OBJECT_ID_RE.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid referral code id" });
  }

  const updateData = {};

  if (req.body.isActive !== undefined) {
    updateData.isActive = Boolean(req.body.isActive);
  }

  if (req.body.label !== undefined) {
    const labelRaw = String(req.body.label || "").trim();
    updateData.label = labelRaw || null;
  }

  if (!Object.keys(updateData).length) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const existing = await prisma.referralCode.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Referral code not found" });
    }

    const updated = await prisma.referralCode.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        _count: { select: { users: true } },
      },
    });

    res.json({ referralCode: formatReferralCode(updated) });
  } catch (error) {
    console.error("Superadmin update referral code failed:", error);
    res.status(500).json({ error: "Failed to update referral code" });
  }
});

router.get("/referral-codes/:id/users", async (req, res) => {
  if (!MONGO_OBJECT_ID_RE.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid referral code id" });
  }

  try {
    const existing = await prisma.referralCode.findUnique({
      where: { id: req.params.id },
      select: { id: true, code: true, label: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Referral code not found" });
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [total, users] = await Promise.all([
      prisma.user.count({ where: { referralCodeId: req.params.id } }),
      prisma.user.findMany({
        where: { referralCodeId: req.params.id },
        orderBy: { referralAppliedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          referralAppliedAt: true,
        },
      }),
    ]);

    res.json({
      referralCode: existing,
      users: users.map((user) => ({
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? null,
        phone: user.phone ?? null,
        role: user.role ? user.role.toLowerCase() : null,
        createdAt: user.createdAt,
        referralAppliedAt: user.referralAppliedAt ?? null,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Superadmin list referral code users failed:", error);
    res.status(500).json({ error: "Failed to list referral users" });
  }
});

function formatAdminNotification(notification, readCount = null) {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    audience: notification.audience,
    targetUserIds: notification.targetUserIds || [],
    recipientCount: notification.recipientCount,
    readCount,
    createdBy: notification.createdBy
      ? {
          id: notification.createdBy.id,
          name: notification.createdBy.name,
          email: notification.createdBy.email,
        }
      : null,
    createdAt: notification.createdAt,
  };
}

async function resolveNotificationRecipients(audience, targetUserIds = []) {
  const notBanned = { isBanned: false };

  if (audience === "ALL") {
    const users = await prisma.user.findMany({
      where: {
        ...notBanned,
        OR: [{ role: "BUYER" }, { role: "SELLER" }],
      },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  if (audience === "BUYERS") {
    const users = await prisma.user.findMany({
      where: { ...notBanned, role: "BUYER" },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  if (audience === "SELLERS") {
    const users = await prisma.user.findMany({
      where: { ...notBanned, role: "SELLER" },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  const uniqueIds = [
    ...new Set(
      (Array.isArray(targetUserIds) ? targetUserIds : [])
        .map((id) => String(id || "").trim())
        .filter((id) => MONGO_OBJECT_ID_RE.test(id)),
    ),
  ];

  if (uniqueIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: uniqueIds },
      ...notBanned,
      OR: [{ role: "BUYER" }, { role: "SELLER" }],
    },
    select: { id: true },
  });
  return users.map((user) => user.id);
}

router.get("/notifications", async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [total, notifications] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.findMany({
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      notifications: notifications.map((item) => formatAdminNotification(item)),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Superadmin list notifications failed:", error);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

router.get("/notifications/:id", async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const readCount = await prisma.userNotification.count({
      where: {
        notificationId: notification.id,
        readAt: { not: null },
      },
    });

    res.json({ notification: formatAdminNotification(notification, readCount) });
  } catch (error) {
    console.error("Superadmin notification detail failed:", error);
    res.status(500).json({ error: "Failed to load notification" });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    const audience = String(req.body.audience || "").trim().toUpperCase();
    const targetUserIds = Array.isArray(req.body.targetUserIds) ? req.body.targetUserIds : [];

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (title.length > NOTIFICATION_TITLE_MAX) {
      return res.status(400).json({
        error: `Title must be ${NOTIFICATION_TITLE_MAX} characters or fewer`,
      });
    }
    if (!body) {
      return res.status(400).json({ error: "Body is required" });
    }
    if (body.length > NOTIFICATION_BODY_MAX) {
      return res.status(400).json({
        error: `Body must be ${NOTIFICATION_BODY_MAX} characters or fewer`,
      });
    }
    if (!NOTIFICATION_AUDIENCES.has(audience)) {
      return res.status(400).json({ error: "Invalid audience" });
    }
    if (audience === "SPECIFIC" && targetUserIds.length === 0) {
      return res.status(400).json({ error: "Select at least one user" });
    }

    const recipientIds = await resolveNotificationRecipients(audience, targetUserIds);
    if (recipientIds.length === 0) {
      return res.status(400).json({ error: "No matching recipients found" });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        body,
        audience,
        targetUserIds: audience === "SPECIFIC" ? recipientIds : [],
        createdById: req.user.id,
        recipientCount: recipientIds.length,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const receiptRows = recipientIds.map((userId) => ({
      notificationId: notification.id,
      userId,
      readAt: null,
    }));

    // Mongo createMany does not support skipDuplicates the same way; insert in chunks.
    const CHUNK = 500;
    for (let i = 0; i < receiptRows.length; i += CHUNK) {
      await prisma.userNotification.createMany({
        data: receiptRows.slice(i, i + CHUNK),
      });
    }

    notifyAdminAnnouncement({
      userIds: recipientIds,
      title,
      body,
      notificationId: notification.id,
    }).catch((error) => {
      console.error("Admin announcement push failed:", error?.message || error);
    });

    res.status(201).json({
      notification: formatAdminNotification(notification, 0),
    });
  } catch (error) {
    console.error("Superadmin send notification failed:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

export default router;
