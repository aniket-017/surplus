import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, Number.parseInt(query.limit, 10) || PAGE_SIZE_DEFAULT),
  );
  return { page, limit, skip: (page - 1) * limit };
}

function formatUserNotification(receipt) {
  return {
    id: receipt.id,
    notificationId: receipt.notificationId,
    title: receipt.notification?.title || "",
    body: receipt.notification?.body || "",
    readAt: receipt.readAt,
    createdAt: receipt.createdAt,
  };
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const where = { userId: req.user.id };
    const [total, receipts] = await Promise.all([
      prisma.userNotification.count({ where }),
      prisma.userNotification.findMany({
        where,
        include: {
          notification: {
            select: {
              title: true,
              body: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      notifications: receipts.map(formatUserNotification),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("List notifications failed:", error);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

router.get("/unread-count", async (req, res) => {
  try {
    const unreadCount = await prisma.userNotification.count({
      where: {
        userId: req.user.id,
        readAt: null,
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Notification unread count failed:", error);
    res.status(500).json({ error: "Failed to load unread count" });
  }
});

router.post("/read-all", async (req, res) => {
  try {
    const now = new Date();
    const result = await prisma.userNotification.updateMany({
      where: {
        userId: req.user.id,
        readAt: null,
      },
      data: { readAt: now },
    });

    res.json({ success: true, updatedCount: result.count });
  } catch (error) {
    console.error("Mark all notifications read failed:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

router.post("/:id/read", async (req, res) => {
  try {
    const receipt = await prisma.userNotification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        notification: {
          select: {
            title: true,
            body: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated =
      receipt.readAt
        ? receipt
        : await prisma.userNotification.update({
            where: { id: receipt.id },
            data: { readAt: new Date() },
            include: {
              notification: {
                select: {
                  title: true,
                  body: true,
                },
              },
            },
          });

    res.json({ notification: formatUserNotification(updated) });
  } catch (error) {
    console.error("Mark notification read failed:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

export default router;
