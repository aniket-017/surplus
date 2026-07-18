import { prisma } from "./prisma.js";
import { getReadableImageUrl } from "./s3.js";

export async function formatMessage(message) {
  const imageUrl = message.imageUrl
    ? await getReadableImageUrl(message.imageUrl)
    : null;

  const fileUrl = message.fileUrl
    ? await getReadableImageUrl(message.fileUrl)
    : null;

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body ?? null,
    imageUrl,
    fileUrl,
    fileName: message.fileName ?? null,
    createdAt: message.createdAt.toISOString(),
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

/**
 * Mark conversation as read up to the latest message currently stored.
 * Uses the max message createdAt so a concurrent newer message is not
 * accidentally marked as read.
 */
export async function markConversationRead(conversation, userId) {
  const latestMessage = await prisma.message.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!latestMessage) {
    return conversation;
  }

  const field = conversation.buyerId === userId ? "buyerLastReadAt" : "sellerLastReadAt";
  const currentReadAt = conversation[field];

  if (currentReadAt && currentReadAt.getTime() >= latestMessage.createdAt.getTime()) {
    return conversation;
  }

  return prisma.conversation.update({
    where: { id: conversation.id },
    data: { [field]: latestMessage.createdAt },
  });
}
