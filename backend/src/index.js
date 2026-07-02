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
import savedRoutes from "./routes/saved.js";
import { backfillCategoryMeta } from "./lib/category.js";
import { CATEGORY_ASSETS_DIR, getCategoryImageManifest } from "./lib/categoryAssets.js";
import { assertS3Config } from "./lib/s3.js";

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
  process.env.FRONTEND_URL, // Frontend (localhost:5000)
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:5173', // Vite dev server (alternate host)
  'http://10.220.255.117:4369', // Mobile app's API base URL
  'http://localhost:4369', // Local development
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
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
app.use("/api/saved", savedRoutes);

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

  backfillCategoryMeta().catch((error) => {
    console.error("Category meta backfill failed:", error.message);
  });
});
