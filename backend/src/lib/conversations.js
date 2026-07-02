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

export async function formatConversationSummary(conversation, currentUserId) {
  const otherParty =
    conversation.buyerId === currentUserId ? conversation.seller : conversation.buyer;

  const lastMessage = conversation.messages?.[0] ?? null;

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
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
  };
}
