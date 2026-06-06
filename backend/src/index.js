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
import { UPLOAD_ROOT } from "./lib/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.resolve(__dirname, "../../frontend/dist");
const FRONTEND_DIST_EXISTS =
  fs.existsSync(FRONTEND_DIST) &&
  fs.existsSync(path.join(FRONTEND_DIST, "index.html"));

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
      "or SMTP email OTP (SMTP_MAIL, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT)"
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
    console.error(
      "Use a Gmail App Password (not your regular password): https://myaccount.google.com/apppasswords"
    );
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5396;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads/products", express.static(UPLOAD_ROOT));

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

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

if (FRONTEND_DIST_EXISTS) {
  app.use(express.static(FRONTEND_DIST));

  app.get(/^(?!\/api|\/uploads).*/, (req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  const methods = [
    isGoogleAuthEnabled() && "Google",
    isOtpAuthEnabled() && "Email OTP",
  ].filter(Boolean);

  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth methods: ${methods.join(", ")}`);
  if (FRONTEND_DIST_EXISTS) {
    console.log(`Serving frontend from ${FRONTEND_DIST}`);
  }
});
