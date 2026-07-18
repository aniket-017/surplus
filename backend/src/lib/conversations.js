import { prisma } from "./prisma.js";
import { getReadableImageUrl } from "./s3.js";

function getOtherPartyReceiptWatermarks(conversation, viewerId) {
  if (conversation.buyerId === viewerId) {
    return {
      deliveredAt: conversation.sellerLastDeliveredAt ?? null,
      readAt: conversation.sellerLastReadAt ?? null,
    };
  }
  if (conversation.sellerId === viewerId) {
    return {
      deliveredAt: conversation.buyerLastDeliveredAt ?? null,
      readAt: conversation.buyerLastReadAt ?? null,
    };
  }
  return { deliveredAt: null, readAt: null };
}

/**
 * WhatsApp-style receipt for the viewer's own messages:
 * sent → delivered (other opened/fetched chat) → read (other marked read).
 */
export function getMessageReceipt(message, conversation, viewerId) {
  if (!viewerId || message.senderId !== viewerId) {
    return { status: null, deliveredAt: null, readAt: null };
  }

  const { deliveredAt, readAt } = getOtherPartyReceiptWatermarks(conversation, viewerId);
  const createdMs = message.createdAt.getTime();

  const isRead = Boolean(readAt && readAt.getTime() >= createdMs);
  const isDelivered = Boolean(deliveredAt && deliveredAt.getTime() >= createdMs);

  if (isRead) {
    return {
      status: "read",
      deliveredAt: (isDelivered ? deliveredAt : readAt).toISOString(),
      readAt: readAt.toISOString(),
    };
  }

  if (isDelivered) {
    return {
      status: "delivered",
      deliveredAt: deliveredAt.toISOString(),
      readAt: null,
    };
  }

  return { status: "sent", deliveredAt: null, readAt: null };
}

export async function formatMessage(message, conversation = null, viewerId = null) {
  const imageUrl = message.imageUrl
    ? await getReadableImageUrl(message.imageUrl)
    : null;

  const fileUrl = message.fileUrl
    ? await getReadableImageUrl(message.fileUrl)
    : null;

  const receipt =
    conversation && viewerId
      ? getMessageReceipt(message, conversation, viewerId)
      : { status: message.senderId === viewerId ? "sent" : null, deliveredAt: null, readAt: null };

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body ?? null,
    imageUrl,
    fileUrl,
    fileName: message.fileName ?? null,
    createdAt: message.createdAt.toISOString(),
    status: receipt.status,
    deliveredAt: receipt.deliveredAt,
    readAt: receipt.readAt,
  };
}

function formatLastMessagePreview(message) {
  if (!message) return null;

  const body = message.body?.trim();
  if (body) return body;
  if (message.imageUrl) return "Photo";
  if (message.fileUrl) return message.fileName || "Document";
  return "Inquiry sent";
}

export function getParticipantLastReadAt(conversation, userId) {
  if (conversation.buyerId === userId) {
    return conversation.buyerLastReadAt ?? null;
  }
  if (conversation.sellerId === userId) {
    return conversation.sellerLastReadAt ?? null;
  }
  return null;
}

export function getUnreadCountFilter(conversation, userId) {
  const lastReadAt = getParticipantLastReadAt(conversation, userId);

  return {
    conversationId: conversation.id,
    senderId: { not: userId },
    ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
  };
}

export async function countUnreadForConversation(conversation, userId) {
  return prisma.message.count({
    where: getUnreadCountFilter(conversation, userId),
  });
}

export async function countTotalUnreadForUser(userId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      buyerLastReadAt: true,
      sellerLastReadAt: true,
    },
  });

  if (conversations.length === 0) return 0;

  const counts = await Promise.all(
    conversations.map((conversation) => countUnreadForConversation(conversation, userId)),
  );

  return counts.reduce((sum, count) => sum + count, 0);
}

export async function formatConversationSummary(conversation, currentUserId) {
  const otherParty =
    conversation.buyerId === currentUserId ? conversation.seller : conversation.buyer;

  const lastMessage = conversation.messages?.[0] ?? null;
  const unreadCount = await countUnreadForConversation(conversation, currentUserId);

  return {
    id: conversation.id,
    productId: conversation.productId,
    product: conversation.product
      ? {
          id: conversation.product.id,
          title: conversation.product.title,
          images: conversation.product.images,
          price: conversation.product.price,
          priceType: conversation.product.priceType.toLowerCase(),
        }
      : null,
    otherParty: otherParty
      ? {
          id: otherParty.id,
          name: otherParty.name || otherParty.email.split("@")[0],
          avatarUrl: otherParty.avatarUrl || null,
        }
      : null,
    lastMessage: lastMessage
      ? {
          body: formatLastMessagePreview(lastMessage),
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt.toISOString(),
        }
      : null,
    unreadCount,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
  };
}

async function advanceParticipantWatermark(conversation, userId, fields) {
  const latestMessage = await prisma.message.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!latestMessage) {
    return conversation;
  }

  const data = {};
  for (const field of fields) {
    const current = conversation[field];
    if (!current || current.getTime() < latestMessage.createdAt.getTime()) {
      data[field] = latestMessage.createdAt;
    }
  }

  if (Object.keys(data).length === 0) {
    return conversation;
  }

  return prisma.conversation.update({
    where: { id: conversation.id },
    data,
  });
}

/**
 * Mark messages as delivered to this participant (opened/fetched the chat).
 */
export async function markConversationDelivered(conversation, userId) {
  const field =
    conversation.buyerId === userId ? "buyerLastDeliveredAt" : "sellerLastDeliveredAt";
  return advanceParticipantWatermark(conversation, userId, [field]);
}

/**
 * Mark conversation as read up to the latest message currently stored.
 * Uses the max message createdAt so a concurrent newer message is not
 * accidentally marked as read. Also advances delivery (open implies delivered).
 */
export async function markConversationRead(conversation, userId) {
  const readField = conversation.buyerId === userId ? "buyerLastReadAt" : "sellerLastReadAt";
  const deliveredField =
    conversation.buyerId === userId ? "buyerLastDeliveredAt" : "sellerLastDeliveredAt";
  return advanceParticipantWatermark(conversation, userId, [readField, deliveredField]);
}
