import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getReadableImageUrl } from "../lib/s3.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

const NOTIFICATION_SELECT = {
  title: true,
  body: true,
  kind: true,
  imageUrl: true,
  actionType: true,
  actionValue: true,
  ctaLabel: true,
};

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, Number.parseInt(query.limit, 10) || PAGE_SIZE_DEFAULT),
  );
  return { page, limit, skip: (page - 1) * limit };
}

async function formatUserNotification(receipt) {
  const notification = receipt.notification;
  return {
    id: receipt.id,
    notificationId: receipt.notificationId,
    title: notification?.title || "",
    body: notification?.body || "",
    kind: notification?.kind || "GENERAL",
    imageUrl: notification?.imageUrl ? await getReadableImageUrl(notification.imageUrl) : null,
    actionType: notification?.actionType || "NONE",
    actionValue: notification?.actionValue || null,
    ctaLabel: notification?.ctaLabel || null,
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
            select: NOTIFICATION_SELECT,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      notifications: await Promise.all(receipts.map(formatUserNotification)),
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
          select: NOTIFICATION_SELECT,
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
                select: NOTIFICATION_SELECT,
              },
            },
          });

    res.json({ notification: await formatUserNotification(updated) });
  } catch (error) {
    console.error("Mark notification read failed:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

export default router;
