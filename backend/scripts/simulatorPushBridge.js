/**
 * Dev only: iOS Simulators cannot receive real Expo pushes, so this watches the
 * database for admin notifications and chat messages sent to one user and
 * delivers them to the booted simulator with `xcrun simctl push`.
 * Usage: npm run sim:push -- <phone> [--device booted] [--interval 3000]
 */
import "dotenv/config";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { prisma } from "../src/lib/prisma.js";
import { buildAdminNotificationData, formatNotificationBody } from "../src/lib/pushNotifications.js";
import { getReadableImageUrl } from "../src/lib/s3.js";

const execFileAsync = promisify(execFile);
const BUNDLE_ID = "com.jasdigital.surplus";

function parseArgs(argv) {
  const args = { phone: null, device: "booted", interval: 3000 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--device") args.device = argv[++i];
    else if (arg === "--interval") args.interval = Number(argv[++i]) || args.interval;
    else if (!args.phone) args.phone = arg;
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findUsersByPhone(phone) {
  const digits = String(phone).replace(/\D/g, "").slice(-10);
  if (digits.length < 10) {
    throw new Error(`Invalid phone number: ${phone}`);
  }
  return prisma.user.findMany({
    where: { phone: { contains: digits }, isDeleted: false },
    select: { id: true, name: true, phone: true, role: true },
  });
}

/** Mirrors the APNs payload Expo builds, where custom data lives under `body`. */
function buildApnsPayload({ title, body, data, badge, imageUrl }) {
  return {
    "Simulator Target Bundle": BUNDLE_ID,
    aps: {
      alert: { title, body },
      sound: "default",
      ...(typeof badge === "number" ? { badge } : {}),
      ...(imageUrl ? { "mutable-content": 1 } : {}),
    },
    body: data,
    ...(imageUrl ? { richContent: { image: imageUrl } } : {}),
  };
}

async function pushToSimulator(device, workDir, payload) {
  const file = path.join(workDir, `push-${Date.now()}.apns`);
  await writeFile(file, JSON.stringify(payload));
  try {
    await execFileAsync("xcrun", ["simctl", "push", device, BUNDLE_ID, file]);
  } finally {
    await rm(file, { force: true });
  }
}

async function latestCreatedAt(userIds) {
  const [lastReceipt, lastMessage] = await Promise.all([
    prisma.userNotification.findFirst({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.message.findFirst({
      where: {
        senderId: { notIn: userIds },
        conversation: {
          is: { OR: [{ buyerId: { in: userIds } }, { sellerId: { in: userIds } }] },
        },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  return {
    notifications: lastReceipt?.createdAt ?? new Date(0),
    messages: lastMessage?.createdAt ?? new Date(0),
  };
}

async function countMessageUnread(userId) {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    select: { buyerId: true, buyerUnreadCount: true, sellerUnreadCount: true },
  });
  return conversations.reduce(
    (total, c) => total + (c.buyerId === userId ? c.buyerUnreadCount : c.sellerUnreadCount),
    0,
  );
}

async function pollAdminNotifications(userIds, since) {
  const receipts = await prisma.userNotification.findMany({
    where: { userId: { in: userIds }, createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
    include: {
      notification: {
        select: {
          id: true,
          title: true,
          body: true,
          kind: true,
          imageUrl: true,
          actionType: true,
          actionValue: true,
        },
      },
    },
  });

  return Promise.all(
    receipts.map(async (receipt) => {
      const { notification } = receipt;
      const imageUrl = notification.imageUrl
        ? await getReadableImageUrl(notification.imageUrl)
        : null;
      return {
        id: `notification:${receipt.id}`,
        createdAt: receipt.createdAt,
        label: notification.kind ? `admin/${notification.kind.toLowerCase()}` : "admin",
        payload: buildApnsPayload({
          title: notification.title,
          body: String(notification.body || "").slice(0, 140),
          imageUrl,
          data: buildAdminNotificationData({
            notificationId: notification.id,
            kind: notification.kind || "GENERAL",
            imageUrl,
            actionType: notification.actionType || "NONE",
            actionValue: notification.actionValue,
          }),
        }),
      };
    }),
  );
}

async function pollMessages(userIds, since) {
  const messages = await prisma.message.findMany({
    where: {
      createdAt: { gt: since },
      senderId: { notIn: userIds },
      conversation: {
        is: { OR: [{ buyerId: { in: userIds } }, { sellerId: { in: userIds } }] },
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { name: true, email: true } },
      conversation: {
        select: {
          id: true,
          buyerId: true,
          sellerId: true,
          product: { select: { title: true } },
        },
      },
    },
  });

  const events = [];
  for (const message of messages) {
    const { conversation } = message;
    const recipientId = userIds.includes(conversation.buyerId)
      ? conversation.buyerId
      : conversation.sellerId;
    const recipientRole = recipientId === conversation.buyerId ? "buyer" : "seller";
    const senderName = message.sender?.name || message.sender?.email?.split("@")[0] || "Someone";
    const productTitle = conversation.product?.title || null;
    const unreadCount = await countMessageUnread(recipientId);

    events.push({
      id: `message:${message.id}`,
      createdAt: message.createdAt,
      label: "message",
      payload: buildApnsPayload({
        title: productTitle ? `${senderName} · ${productTitle}` : senderName,
        body: formatNotificationBody(message),
        data: { type: "message", conversationId: conversation.id, recipientRole, unreadCount },
        badge: unreadCount,
      }),
    });
  }
  return events;
}

async function main() {
  const { phone, device, interval } = parseArgs(process.argv.slice(2));
  if (!phone) {
    console.error("Usage: npm run sim:push -- <phone> [--device booted] [--interval 3000]");
    process.exitCode = 1;
    return;
  }

  const users = await findUsersByPhone(phone);
  if (users.length === 0) {
    console.error(`No user found with phone ${phone}`);
    process.exitCode = 1;
    return;
  }

  const userIds = users.map((user) => user.id);
  for (const user of users) {
    console.log(`Watching ${user.name || "(no name)"} ${user.phone} [${user.role}] id=${user.id}`);
  }
  console.log(`Forwarding to simulator "${device}" every ${interval}ms. Ctrl+C to stop.\n`);

  const workDir = await mkdtemp(path.join(tmpdir(), "surplus-sim-push-"));
  let stopping = false;
  process.on("SIGINT", () => {
    stopping = true;
  });

  const cursors = await latestCreatedAt(userIds);
  const delivered = new Set();

  try {
    while (!stopping) {
      try {
        const [adminEvents, messageEvents] = await Promise.all([
          pollAdminNotifications(userIds, cursors.notifications),
          pollMessages(userIds, cursors.messages),
        ]);

        for (const event of [...adminEvents, ...messageEvents]) {
          if (delivered.has(event.id)) continue;
          await pushToSimulator(device, workDir, event.payload);
          delivered.add(event.id);
          console.log(
            `[${new Date().toLocaleTimeString()}] ${event.label}: ${event.payload.aps.alert.title} — ${event.payload.aps.alert.body}`,
          );
        }

        for (const event of adminEvents) {
          if (event.createdAt > cursors.notifications) cursors.notifications = event.createdAt;
        }
        for (const event of messageEvents) {
          if (event.createdAt > cursors.messages) cursors.messages = event.createdAt;
        }
      } catch (error) {
        console.error("Poll failed:", error?.stderr?.toString() || error?.message || error);
      }
      await sleep(interval);
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
