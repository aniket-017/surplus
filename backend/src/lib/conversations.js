export function formatMessage(message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body ?? null,
    createdAt: message.createdAt.toISOString(),
  };
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
          body: lastMessage.body,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt.toISOString(),
        }
      : null,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
  };
}
