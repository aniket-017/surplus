import { prisma } from "./prisma.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_CHUNK_SIZE = 100;

function isExpoPushToken(token) {
  return typeof token === "string" && /^ExponentPushToken\[.+\]$/.test(token);
}

function formatNotificationBody(message) {
  const body = message.body?.trim();
  if (body) return body.slice(0, 140);
  if (message.imageUrl) return "Sent a photo";
  if (message.fileUrl) return message.fileName ? `Sent ${message.fileName}` : "Sent a document";
  return "Sent a message";
}

function getExpoHeaders() {
  const headers = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  const expoAccessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`;
  }
  return headers;
}

async function cleanupInvalidTokens(tokens, tickets) {
  const invalidTokens = [];

  for (let i = 0; i < tickets.length; i += 1) {
    const ticket = tickets[i];
    const token = tokens[i];
    if (!ticket || ticket.status !== "error") continue;

    const errorCode = ticket.details?.error;
    if (errorCode === "DeviceNotRegistered" || errorCode === "InvalidCredentials") {
      invalidTokens.push(token);
    }
  }

  if (invalidTokens.length === 0) return;

  await prisma.pushToken.deleteMany({
    where: { token: { in: invalidTokens } },
  });
}

async function sendExpoMessages(messages) {
  if (!messages.length) return;

  for (let i = 0; i < messages.length; i += EXPO_PUSH_CHUNK_SIZE) {
    const chunk = messages.slice(i, i + EXPO_PUSH_CHUNK_SIZE);
    const tokens = chunk.map((message) => message.to);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: getExpoHeaders(),
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("Expo push request failed:", response.status, errorText);
        continue;
      }

      const result = await response.json().catch(() => null);
      const tickets = Array.isArray(result?.data) ? result.data : [];
      await cleanupInvalidTokens(tokens, tickets);
    } catch (error) {
      console.error("Failed to send Expo push chunk:", error?.message || error);
    }
  }
}

function buildPushMessage(token, { title, body, data, channelId = "messages" }) {
  return {
    to: token,
    sound: "default",
    title,
    body,
    data,
    badge: typeof data?.unreadCount === "number" ? data.unreadCount : undefined,
    channelId,
    priority: "high",
    ttl: 86400,
  };
}

export async function sendPushToUser(userId, { title, body, data, channelId = "messages" }) {
  try {
    const records = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    const tokens = records.map((record) => record.token).filter(isExpoPushToken);
    if (tokens.length === 0) return;

    const messages = tokens.map((token) =>
      buildPushMessage(token, { title, body, data, channelId }),
    );
    await sendExpoMessages(messages);
  } catch (error) {
    console.error("Failed to send push notification:", error?.message || error);
  }
}

export async function sendPushToUsers(userIds, { title, body, data, channelId = "messages" }) {
  try {
    const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const records = await prisma.pushToken.findMany({
      where: { userId: { in: uniqueIds } },
      select: { token: true },
    });

    const tokens = records.map((record) => record.token).filter(isExpoPushToken);
    if (tokens.length === 0) return;

    const messages = tokens.map((token) =>
      buildPushMessage(token, { title, body, data, channelId }),
    );
    await sendExpoMessages(messages);
  } catch (error) {
    console.error("Failed to send batch push notifications:", error?.message || error);
  }
}

export async function notifyNewMessage({
  recipientId,
  recipientRole,
  conversationId,
  senderName,
  productTitle,
  message,
  unreadCount,
}) {
  const preview = formatNotificationBody(message);
  const title = productTitle
    ? `${senderName || "Someone"} · ${productTitle}`
    : senderName || "New message";

  await sendPushToUser(recipientId, {
    title,
    body: preview,
    data: {
      type: "message",
      conversationId,
      recipientRole,
      unreadCount,
    },
    channelId: "messages",
  });
}

export async function notifyAdminAnnouncement({ userIds, title, body, notificationId }) {
  await sendPushToUsers(userIds, {
    title,
    body: String(body || "").slice(0, 140),
    data: {
      type: "admin_notification",
      notificationId,
    },
    channelId: "announcements",
  });
}
