import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  countTotalUnreadForUser,
  formatMessage,
  formatConversationSummary,
  markConversationDelivered,
  markConversationRead,
} from "../lib/conversations.js";
import { optimizeProductImage } from "../lib/imageOptimize.js";
import { notifyNewMessage } from "../lib/pushNotifications.js";
import { uploadMessageFile, uploadMessageImage as uploadMessageImageToS3 } from "../lib/s3.js";
import { getMessageUploadFile, isImageUpload, uploadMessageAttachment } from "../lib/upload.js";
import { requireAuth } from "../middleware/auth.js";

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

// Test endpoint for debugging connectivity
router.post("/:id/test-upload", requireAuth, (req, res) => {
  console.log("=== TEST UPLOAD ENDPOINT HIT ===");
  console.log("Conversation ID:", req.params.id);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.json({ success: true, message: "Test endpoint reached successfully" });
});

// Test endpoint for debugging file uploads specifically
router.post("/:id/test-file-upload", requireAuth, handleMessageUpload, async (req, res) => {
  console.log("=== TEST FILE UPLOAD ENDPOINT HIT ===");
  console.log("Conversation ID:", req.params.id);
  console.log("Headers:", req.headers);
  console.log("Files:", req.files);
  console.log("Body:", req.body);
  
  try {
    const uploadedFile = getMessageUploadFile(req);
    console.log("Found uploaded file:", uploadedFile ? {
      fieldname: uploadedFile.fieldname,
      originalname: uploadedFile.originalname,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
      hasBuffer: !!uploadedFile.buffer,
    } : "No file");

    if (uploadedFile) {
      console.log("Testing image processing...");
      if (isImageUpload(uploadedFile)) {
        console.log("Processing as image...");
        const optimized = await optimizeProductImage(uploadedFile, 0);
        console.log("Image optimization successful");
        
        // Test S3 upload without saving to database
        console.log("Testing S3 upload...");
        const testUrl = await uploadMessageImageToS3('test-conversation-id', optimized);
        console.log("S3 upload successful:", testUrl);
        
        return res.json({ 
          success: true, 
          message: "File upload test successful",
          fileType: "image",
          optimized: {
            mimetype: optimized.mimetype,
            size: optimized.buffer.length
          },
          s3Url: testUrl
        });
      } else {
        console.log("Processing as document...");
        const testUrl = await uploadMessageFile('test-conversation-id', uploadedFile);
        console.log("Document upload successful:", testUrl);
        
        return res.json({ 
          success: true, 
          message: "File upload test successful",
          fileType: "document",
          s3Url: testUrl
        });
      }
    }
    
    res.json({ success: true, message: "No file provided for test" });
  } catch (error) {
    console.error("Test file upload failed:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});

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
  console.log("=== MESSAGE UPLOAD REQUEST ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("User-Agent:", req.headers["user-agent"]);

  const contentType = (req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("application/json")) {
    console.log("Detected JSON content, skipping multer");
    return next();
  }

  console.log("Processing multipart upload...");
  uploadMessageAttachment(req, res, (error) => {
    if (error) {
      console.error("Multer error:", error);
      return res.status(400).json({ error: error.message || "Invalid upload" });
    }
    console.log("Multer processing completed successfully");
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

    // Buyer has seen their own inquiry; seller still has it unread.
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
        buyerLastReadAt: message.createdAt,
      },
      include: {
        product: { select: { id: true, title: true, images: true } },
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true },
    });

    await notifyRecipientOfMessage({
      conversation,
      message,
      sender: sender || { id: req.user.id, name: null, email: null },
    });

    res.status(201).json({
      conversationId: conversation.id,
      message: await formatMessage(message, conversation, req.user.id),
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

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    // Opening/fetching the thread counts as delivered for the other party's ticks.
    // Don't fail the whole fetch if delivery watermark update errors.
    let receiptConversation = conversation;
    try {
      receiptConversation = await markConversationDelivered(conversation, req.user.id);
    } catch (deliveryError) {
      console.error("Mark conversation delivered failed:", deliveryError);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip,
    });

    const otherParty = conversation.buyerId === req.user.id ? conversation.seller : conversation.buyer;

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
  console.log("🚀 UPLOAD ROUTE HIT! Conversation ID:", req.params.id);
  console.log("📋 Request Headers:", req.headers);
  console.log("📁 Files:", req.files);
  console.log("📝 Body:", req.body);
  
  try {
    console.log("Message upload request:", {
      conversationId: req.params.id,
      contentType: req.headers["content-type"],
      hasFiles: !!req.files,
      filesType: Array.isArray(req.files) ? "array" : typeof req.files,
      filesLength: Array.isArray(req.files) ? req.files.length : Object.keys(req.files || {}).length,
      bodyKeys: Object.keys(req.body || {}),
    });

    console.log("🔍 Step 1: Getting conversation...");
    const conversation = await getConversationForUser(req.params.id, req.user.id);

    if (!conversation) {
      console.log("❌ Conversation not found");
      return res.status(404).json({ error: "Conversation not found" });
    }
    console.log("✅ Conversation found:", conversation.id);

    const body = req.body.body ? String(req.body.body).trim() : "";
    let imageUrl = null;
    let fileUrl = null;
    let fileName = null;

    console.log("🔍 Step 2: Processing uploaded file...");
    const uploadedFile = getMessageUploadFile(req);
    console.log(
      "Uploaded file:",
      uploadedFile
        ? {
            fieldname: uploadedFile.fieldname,
            originalname: uploadedFile.originalname,
            mimetype: uploadedFile.mimetype,
            size: uploadedFile.size,
          }
        : "No file found",
    );

    if (uploadedFile) {
      console.log("🔍 Step 3: Processing file based on type...");
      try {
        if (isImageUpload(uploadedFile)) {
          console.log("📷 Processing image upload...");
          console.log("🔧 Step 3a: Optimizing image...");
          const optimized = await optimizeProductImage(uploadedFile, 0);
          console.log("✅ Image optimization complete");
          
          console.log("☁️ Step 3b: Uploading to S3...");
          imageUrl = await uploadMessageImageToS3(conversation.id, optimized);
          console.log("✅ Image uploaded to S3:", imageUrl);
        } else {
          console.log("📄 Processing document upload...");
          fileName = uploadedFile.originalname || (req.body.fileName ? String(req.body.fileName) : "document");
          console.log("☁️ Step 3c: Uploading document to S3...");
          fileUrl = await uploadMessageFile(conversation.id, uploadedFile);
          console.log("✅ Document uploaded to S3:", fileUrl);
        }
      } catch (uploadError) {
        console.error("❌ File processing failed:", uploadError);
        console.error("❌ Upload error details:", uploadError.message);
        console.error("❌ Upload error stack:", uploadError.stack);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
    }

    if (!body && !imageUrl && !fileUrl) {
      console.log("❌ No content provided");
      return res.status(400).json({ error: "Message body or attachment is required" });
    }

    console.log("🔍 Step 4: Creating message in database...");
    const messageData = {
      conversationId: conversation.id,
      senderId: req.user.id,
      body: body || null,
      imageUrl,
      fileUrl,
      fileName,
    };
    console.log("💾 Message data:", messageData);

    const message = await prisma.message.create({
      data: messageData,
    });
    console.log("✅ Message created:", message.id);

    console.log("🔍 Step 5: Updating conversation timestamp...");
    const readField =
      conversation.buyerId === req.user.id ? "buyerLastReadAt" : "sellerLastReadAt";
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
        [readField]: message.createdAt,
      },
      include: {
        product: { select: { id: true, title: true, images: true } },
      },
    });
    console.log("✅ Conversation updated");

    console.log("🔍 Step 6: Formatting message response...");
    const formattedMessage = await formatMessage(message, updatedConversation, req.user.id);

    const sender = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true },
    });

    await notifyRecipientOfMessage({
      conversation: updatedConversation,
      message,
      sender: sender || { id: req.user.id, name: null, email: null },
    });

    console.log("✅ Message saved successfully:", message.id);
    res.status(201).json({ message: formattedMessage });
  } catch (error) {
    console.error("❌ Send message failed:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // More detailed error information
    if (error.code) {
      console.error("❌ Error code:", error.code);
    }
    if (error.meta) {
      console.error("❌ Error meta:", error.meta);
    }
    
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
