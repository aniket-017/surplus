import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { formatMessage, formatConversationSummary } from "../lib/conversations.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

async function getConversationForUser(conversationId, userId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      buyer: { select: { id: true, name: true, email: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, email: true, avatarUrl: true } },
      product: true,
    },
  });

  if (!conversation) {
    return null;
  }

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    return null;
  }

  return conversation;
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const productId = String(req.body.productId || "").trim();
    const messageBody = req.body.message ? String(req.body.message).trim() : null;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.sellerId === req.user.id) {
      return res.status(400).json({ error: "You cannot inquire on your own listing" });
    }

    let conversation = await prisma.conversation.findUnique({
      where: {
        buyerId_productId: {
          buyerId: req.user.id,
          productId,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          buyerId: req.user.id,
          sellerId: product.sellerId,
          productId,
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        body: messageBody || null,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    });

    res.status(201).json({
      conversationId: conversation.id,
      message: formatMessage(message),
      isNew: !messageBody && conversation.createdAt.getTime() === message.createdAt.getTime(),
    });
  } catch (error) {
    console.error("Create conversation failed:", error);
    res.status(500).json({ error: "Failed to start inquiry" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        buyer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, email: true, avatarUrl: true } },
        product: { select: { id: true, title: true, images: true, price: true, priceType: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    res.json({
      conversations: await Promise.all(
        conversations.map((conversation) => formatConversationSummary(conversation, userId)),
      ),
    });
  } catch (error) {
    console.error("List conversations failed:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.get("/:id/messages", requireAuth, async (req, res) => {
  try {
    const conversation = await getConversationForUser(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip,
    });

    res.json({
      conversation: {
        id: conversation.id,
        productId: conversation.productId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
      },
      messages: messages.map(formatMessage),
    });
  } catch (error) {
    console.error("List messages failed:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/:id/messages", requireAuth, async (req, res) => {
  try {
    const conversation = await getConversationForUser(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const body = req.body.body ? String(req.body.body).trim() : "";

    if (!body) {
      return res.status(400).json({ error: "Message body is required" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        body,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    });

    res.status(201).json({ message: formatMessage(message) });
  } catch (error) {
    console.error("Send message failed:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
