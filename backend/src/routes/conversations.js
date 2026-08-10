import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  countTotalUnreadForUser,
  formatMessage,
  formatConversationSummary,
  getUnreadFieldForRecipient,
  markConversationDelivered,
  markConversationRead,
  resolveMessageCursor,
} from "../lib/conversations.js";
import { optimizeProductImage } from "../lib/imageOptimize.js";
import { notifyNewMessage } from "../lib/pushNotifications.js";
import { uploadMessageFile, uploadMessageImage as uploadMessageImageToS3 } from "../lib/s3.js";
import { getMessageUploadFile, isImageUpload, uploadMessageAttachment } from "../lib/upload.js";
import { requireAuth } from "../middleware/auth.js";
import { isActiveListing } from "../lib/product.js";

const router = Router();

async function notifyRecipientOfMessage({ conversation, message, sender }) {
  const recipientId =
    conversation.buyerId === sender.id ? conversation.sellerId : conversation.buyerId;
  const recipientRole = conversation.buyerId === recipientId ? "buyer" : "seller";
  const senderName = sender.name || sender.email?.split("@")[0] || "Someone";
  const productTitle = conversation.product?.title || null;
  const unreadCount = await countTotalUnreadForUser(recipientId);

  await notifyNewMessage({
    recipientId,
    recipientRole,
    conversationId: conversation.id,
    senderName,
    productTitle,
    message,
    unreadCount,
  });
}

function fireAndForgetNotify(payload) {
  notifyRecipientOfMessage(payload).catch((error) => {
    console.error("Push notification failed:", error);
  });
}

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

function handleMessageUpload(req, res, next) {
  const contentType = (req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("application/json")) {
    return next();
  }

  uploadMessageAttachment(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || "Invalid upload" });
    }
    next();
  });
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
      select: { id: true, sellerId: true, listingStatus: true },
    });

    if (!product || !isActiveListing(product)) {
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

    // Buyer has seen their own inquiry; seller still has it unread.
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
        buyerLastReadAt: message.createdAt,
        buyerUnreadCount: 0,
        sellerUnreadCount: (conversation.sellerUnreadCount ?? 0) + 1,
      },
      include: {
        product: { select: { id: true, title: true, images: true } },
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true },
    });

    const formattedMessage = await formatMessage(message, conversation, req.user.id);

    fireAndForgetNotify({
      conversation,
      message,
      sender: sender || { id: req.user.id, name: null, email: null },
    });

    res.status(201).json({
      conversationId: conversation.id,
      message: formattedMessage,
      isNew: !messageBody && conversation.createdAt.getTime() === message.createdAt.getTime(),
    });
  } catch (error) {
    console.error("Create conversation failed:", error);
    res.status(500).json({ error: "Failed to start inquiry" });
  }
});

router.get("/unread-count", requireAuth, async (req, res) => {
  try {
    const unreadCount = await countTotalUnreadForUser(req.user.id);
    res.json({ unreadCount });
  } catch (error) {
    console.error("Get unread count failed:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
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

    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const after = req.query.after ? String(req.query.after) : null;
    const before = req.query.before ? String(req.query.before) : null;

    // Opening/fetching the thread counts as delivered for the other party's ticks.
    let receiptConversation = conversation;
    try {
      receiptConversation = await markConversationDelivered(conversation, req.user.id);
    } catch (deliveryError) {
      console.error("Mark conversation delivered failed:", deliveryError);
    }

    let messages;
    let hasMoreOlder = false;

    if (after) {
      const cursor = await resolveMessageCursor(after, conversation.id);
      // Unknown/optimistic cursors → empty delta (avoid Prisma ObjectId errors).
      if (!cursor) {
        messages = [];
      } else {
        messages = await prisma.message.findMany({
          where: {
            conversationId: conversation.id,
            createdAt: { gt: cursor.createdAt },
          },
          orderBy: { createdAt: "asc" },
          take: limit,
        });
      }
    } else if (before) {
      const cursor = await resolveMessageCursor(before, conversation.id);
      if (!cursor) {
        messages = [];
        hasMoreOlder = false;
      } else {
        messages = await prisma.message.findMany({
          where: {
            conversationId: conversation.id,
            createdAt: { lt: cursor.createdAt },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });
        hasMoreOlder = messages.length === limit;
        messages.reverse();
      }
    } else {
      messages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      hasMoreOlder = messages.length === limit;
      messages.reverse();
    }

    const otherParty =
      conversation.buyerId === req.user.id ? conversation.seller : conversation.buyer;

    res.json({
      conversation: {
        id: conversation.id,
        productId: conversation.productId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        otherParty: otherParty
          ? {
              id: otherParty.id,
              name: otherParty.name || otherParty.email.split("@")[0],
              avatarUrl: otherParty.avatarUrl || null,
            }
          : null,
        product: conversation.product
          ? {
              id: conversation.product.id,
              title: conversation.product.title,
              images: conversation.product.images,
            }
          : null,
      },
      messages: await Promise.all(
        messages.map((message) => formatMessage(message, receiptConversation, req.user.id)),
      ),
      hasMoreOlder,
    });
  } catch (error) {
    console.error("List messages failed:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/:id/read", requireAuth, async (req, res) => {
  try {
    const conversation = await getConversationForUser(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await markConversationRead(conversation, req.user.id);
    const unreadCount = await countTotalUnreadForUser(req.user.id);

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Mark conversation read failed:", error);
    res.status(500).json({ error: "Failed to mark conversation as read" });
  }
});

router.post("/:id/messages", requireAuth, handleMessageUpload, async (req, res) => {
  try {
    const conversation = await getConversationForUser(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const body = req.body.body ? String(req.body.body).trim() : "";
    let imageUrl = null;
    let fileUrl = null;
    let fileName = null;

    const uploadedFile = getMessageUploadFile(req);

    if (uploadedFile) {
      try {
        if (isImageUpload(uploadedFile)) {
          const optimized = await optimizeProductImage(uploadedFile, 0);
          imageUrl = await uploadMessageImageToS3(conversation.id, optimized);
        } else {
          fileName =
            uploadedFile.originalname ||
            (req.body.fileName ? String(req.body.fileName) : "document");
          fileUrl = await uploadMessageFile(conversation.id, uploadedFile);
        }
      } catch (uploadError) {
        console.error("File processing failed:", uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
    }

    if (!body && !imageUrl && !fileUrl) {
      return res.status(400).json({ error: "Message body or attachment is required" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        body: body || null,
        imageUrl,
        fileUrl,
        fileName,
      },
    });

    const readField =
      conversation.buyerId === req.user.id ? "buyerLastReadAt" : "sellerLastReadAt";
    const unreadField = getUnreadFieldForRecipient(conversation, req.user.id);
    const senderUnreadField =
      conversation.buyerId === req.user.id ? "buyerUnreadCount" : "sellerUnreadCount";
    const updateData = {
      lastMessageAt: message.createdAt,
      [readField]: message.createdAt,
      [senderUnreadField]: 0,
    };
    if (unreadField) {
      updateData[unreadField] = (conversation[unreadField] ?? 0) + 1;
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: updateData,
      include: {
        product: { select: { id: true, title: true, images: true } },
      },
    });

    const formattedMessage = await formatMessage(message, updatedConversation, req.user.id);

    const sender = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true },
    });

    fireAndForgetNotify({
      conversation: updatedConversation,
      message,
      sender: sender || { id: req.user.id, name: null, email: null },
    });

    res.status(201).json({ message: formattedMessage });
  } catch (error) {
    console.error("Send message failed:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
