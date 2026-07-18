import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport, { configurePassport } from "./config/passport.js";
import { isGoogleAuthEnabled, isOtpAuthEnabled } from "./config/auth.js";
import { verifySmtpConnection } from "./lib/mail.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import conversationRoutes from "./routes/conversations.js";
import pushTokenRoutes from "./routes/pushTokens.js";
import savedRoutes from "./routes/saved.js";
import superadminRoutes from "./routes/superadmin.js";
import { backfillCategoryMeta } from "./lib/category.js";
import { CATEGORY_ASSETS_DIR, getCategoryImageManifest } from "./lib/categoryAssets.js";
import { bootstrapSuperAdmin } from "./lib/bootstrapSuperAdmin.js";
import { prisma } from "./lib/prisma.js";
import { assertS3Config } from "./lib/s3.js";

async function backfillConversationReadState() {
  // Existing conversations may omit last-read fields entirely. MongoDB/Prisma
  // does not reliably match missing fields with `{ field: null }`, so filter in JS.
  // Treat prior history as already read so unread badges are not flooded.
  const conversations = await prisma.conversation.findMany({
    select: {
      id: true,
      lastMessageAt: true,
      buyerLastReadAt: true,
      sellerLastReadAt: true,
    },
  });

  const needsBackfill = conversations.filter(
    (conversation) => conversation.buyerLastReadAt == null && conversation.sellerLastReadAt == null,
  );

  if (needsBackfill.length === 0) return;

  await Promise.all(
    needsBackfill.map((conversation) =>
      prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          buyerLastReadAt: conversation.lastMessageAt,
          sellerLastReadAt: conversation.lastMessageAt,
        },
      }),
    ),
  );

  console.log(`Backfilled read state for ${needsBackfill.length} conversations`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.resolve(__dirname, "../../frontend/dist");
const FRONTEND_DIST_EXISTS = fs.existsSync(FRONTEND_DIST) && fs.existsSync(path.join(FRONTEND_DIST, "index.html"));

const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_URL"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (!isGoogleAuthEnabled() && !isOtpAuthEnabled()) {
  console.error(
    "Configure either Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) " +
      "or SMTP email OTP (SMTP_MAIL, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT)",
  );
  process.exit(1);
}

if (isGoogleAuthEnabled()) {
  if (!process.env.GOOGLE_CALLBACK_URL) {
    console.error("Missing required environment variable: GOOGLE_CALLBACK_URL");
    process.exit(1);
  }
  configurePassport();
}

if (isOtpAuthEnabled()) {
  try {
    await verifySmtpConnection();
    console.log("SMTP connection verified");
  } catch (error) {
    console.error("SMTP verification failed:", error.message);
    console.error("Use a Gmail App Password (not your regular password): https://myaccount.google.com/apppasswords");
    process.exit(1);
  }
}

try {
  assertS3Config();
  console.log("AWS S3 configuration verified");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4369;

// Allow CORS for mobile app and frontend
const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/+$/, ""), // Frontend (strip trailing slash to match Origin header)
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:5173', // Vite dev server (alternate host)
  'http://10.220.255.117:4369', // Mobile app's API base URL
  'http://localhost:4369', // Local development
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        // Deny by omitting CORS headers instead of erroring the request.
        // Same-origin requests (e.g. frontend assets served by this server
        // with Vite's crossorigin attribute) still succeed without headers.
        callback(null, false);
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

if (isGoogleAuthEnabled()) {
  app.use(passport.initialize());
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    auth: {
      google: isGoogleAuthEnabled(),
      otp: isOtpAuthEnabled(),
    },
  });
});

app.get("/api/assets/categories/manifest", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(getCategoryImageManifest());
});

app.use(
  "/api/assets/categories",
  express.static(CATEGORY_ASSETS_DIR, {
    etag: true,
    lastModified: true,
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    },
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/push-tokens", pushTokenRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/superadmin", superadminRoutes);

if (FRONTEND_DIST_EXISTS) {
  app.use(express.static(FRONTEND_DIST));

  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use((err, req, res, _next) => {
  console.error("[express-error]", {
    method: req.method,
    path: req.originalUrl,
    message: err?.message || String(err),
    stack: err?.stack,
  });
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  const methods = [isGoogleAuthEnabled() && "Google", isOtpAuthEnabled() && "Email OTP"].filter(Boolean);

  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth methods: ${methods.join(", ")}`);
  console.log(`[startup] Gemini: ${process.env.GEMINI_API_KEY ? "configured" : "MISSING GEMINI_API_KEY"}`);
  if (FRONTEND_DIST_EXISTS) {
    console.log(`Serving frontend from ${FRONTEND_DIST}`);
  }

  bootstrapSuperAdmin().catch((error) => {
    console.error("Superadmin bootstrap failed:", error.message);
  });

  backfillCategoryMeta().catch((error) => {
    console.error("Category meta backfill failed:", error.message);
  });

  backfillConversationReadState().catch((error) => {
    console.error("Conversation read-state backfill failed:", error.message);
  });
});
