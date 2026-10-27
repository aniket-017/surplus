import { Router } from "express";
import passport from "../config/passport.js";
import { isGoogleAuthEnabled, isOtpAuthEnabled, isPhoneAuthEnabled, getAuthMethods } from "../config/auth.js";
import { prisma } from "../lib/prisma.js";
import { withPrismaRetry } from "../lib/prismaRetry.js";
import { setAuthCookie, clearAuthCookie, formatUser, parseUserAddress, userSelect } from "../lib/auth.js";
import { sendOtpEmail } from "../lib/mail.js";
import { generateOtp, hashOtp, getOtpExpiry, isValidEmail } from "../lib/otp.js";
import {
  maskPhone,
  Msg91Error,
  PHONE_OTP_LENGTH,
  resendPhoneOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../lib/msg91.js";
import { toE164Phone } from "../lib/phone.js";
import { createLogger } from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";
import { otpSendRateLimit, otpVerifyRateLimit } from "../middleware/otpRateLimit.js";

const router = Router();
const authLogger = createLogger("auth");
const phoneAuthLogger = createLogger("phone-auth");

// Test account for Play Store app review: no email is sent, a fixed OTP is accepted.
const TEST_ACCOUNT_EMAIL = "aniketkhillare17@gmail.com";
const TEST_ACCOUNT_OTP = "123456";

function isTestAccount(email) {
  return email === TEST_ACCOUNT_EMAIL;
}

function isTestPhone(phone) {
  const testPhone = toE164Phone(process.env.MSG91_TEST_PHONE?.trim() || "");
  return Boolean(testPhone && process.env.MSG91_TEST_OTP?.trim() && phone === testPhone);
}

function sendPhoneAuthError(res, error, fallback, logContext) {
  if (error instanceof Msg91Error) {
    phoneAuthLogger.warn(`${logContext.action} failed`, { ...logContext, status: error.status, error: error.message });
    return res.status(error.status).json({ error: error.message });
  }
  phoneAuthLogger.error(`${logContext.action} crashed (${maskPhone(logContext.phone)})`, error);
  return res.status(500).json({ error: fallback });
}

function phoneLogContext(req, action, phone) {
  return { action, phone: maskPhone(phone), ip: req.ip, testPhone: isTestPhone(phone) };
}

function parseRole(role) {
  const normalized = role?.trim().toLowerCase();
  if (normalized === "buyer") return "BUYER";
  if (normalized === "seller") return "SELLER";
  return null;
}

function parseAuthIntent(raw) {
  return raw === "signup" ? "signup" : "signin";
}

async function findUserByPhone(phone) {
  return prisma.user.findFirst({
    where: { phone, isDeleted: false },
    select: userSelect,
  });
}

router.get("/methods", (_req, res) => {
  res.json(getAuthMethods());
});

if (isGoogleAuthEnabled()) {
  router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    }),
    (req, res) => {
      if (req.user?.isBanned) {
        return res.redirect(`${process.env.FRONTEND_URL}/signin?error=banned`);
      }
      setAuthCookie(res, req.user);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?success=true`);
    },
  );
}

function requirePhoneAuth(_req, res, next) {
  if (!isPhoneAuthEnabled()) {
    return res.status(503).json({
      error: "Phone authentication is not configured on the server.",
    });
  }
  next();
}

function parsePhoneBody(req, res) {
  const phone = toE164Phone(req.body?.phone);
  if (!phone) {
    res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number." });
    return null;
  }
  return phone;
}

router.post("/phone/send", requirePhoneAuth, otpSendRateLimit, async (req, res) => {
  const phone = parsePhoneBody(req, res);
  if (!phone) return;
  const logContext = phoneLogContext(req, "send", phone);

  try {
    if (isTestPhone(phone)) {
      phoneAuthLogger.info("send skipped for test phone (no SMS)", logContext);
    } else {
      const result = await sendPhoneOtp(phone);
      phoneAuthLogger.info("send accepted by MSG91", { ...logContext, requestId: result?.request_id });
    }
    res.json({ message: "OTP sent to your phone" });
  } catch (error) {
    sendPhoneAuthError(res, error, "Failed to send OTP. Please try again.", logContext);
  }
});

router.post("/phone/resend", requirePhoneAuth, otpSendRateLimit, async (req, res) => {
  const phone = parsePhoneBody(req, res);
  if (!phone) return;
  const logContext = phoneLogContext(req, "resend", phone);

  try {
    if (isTestPhone(phone)) {
      phoneAuthLogger.info("resend skipped for test phone (no SMS)", logContext);
    } else {
      try {
        await resendPhoneOtp(phone, req.body?.channel === "voice" ? "voice" : "text");
        phoneAuthLogger.info("resend accepted by MSG91", logContext);
      } catch (error) {
        // Retry only works while the original OTP is active; otherwise issue a new one.
        if (!(error instanceof Msg91Error) || error.status === 429 || error.status === 503) {
          throw error;
        }
        phoneAuthLogger.info("retry rejected, sending a fresh OTP", { ...logContext, reason: error.message });
        const result = await sendPhoneOtp(phone);
        phoneAuthLogger.info("fresh send accepted by MSG91", { ...logContext, requestId: result?.request_id });
      }
    }
    res.json({ message: "OTP resent to your phone" });
  } catch (error) {
    sendPhoneAuthError(res, error, "Failed to resend OTP. Please try again.", logContext);
  }
});

router.post("/phone/verify", requirePhoneAuth, otpVerifyRateLimit, async (req, res) => {
  const phone = parsePhoneBody(req, res);
  if (!phone) return;

  const code = typeof req.body.otp === "string" ? req.body.otp.trim() : "";
  if (code.length !== PHONE_OTP_LENGTH || !/^\d+$/.test(code)) {
    return res.status(400).json({ error: `Enter the ${PHONE_OTP_LENGTH}-digit verification code.` });
  }

  const logContext = phoneLogContext(req, "verify", phone);

  try {
    if (isTestPhone(phone)) {
      if (code !== process.env.MSG91_TEST_OTP.trim()) {
        phoneAuthLogger.warn("verify failed: wrong test OTP", logContext);
        return res.status(400).json({ error: "Invalid OTP. Please check the code and try again." });
      }
    } else {
      await verifyPhoneOtp(phone, code);
    }

    const existingUser = await findUserByPhone(phone);

    if (existingUser?.isBanned) {
      phoneAuthLogger.warn("verify blocked: banned user", { ...logContext, userId: existingUser.id });
      return res.status(403).json({ error: "This account has been banned" });
    }

    const user =
      existingUser ??
      (await prisma.user.create({
        data: { phone },
        select: userSelect,
      }));

    phoneAuthLogger.info(existingUser ? "verified, signed in existing user" : "verified, created new user", {
      ...logContext,
      userId: user.id,
    });

    const token = setAuthCookie(res, user);

    res.json({
      message: "Signed in successfully",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "An account with this phone number already exists.",
      });
    }

    sendPhoneAuthError(res, error, "Failed to sign in with phone number", logContext);
  }
});

if (isOtpAuthEnabled()) {
  router.post("/otp/send", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const intent = parseAuthIntent(req.body.intent);

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    try {
      const existingUser = await prisma.user.findFirst({
        where: { email, isDeleted: false },
        select: { id: true, isBanned: true },
      });

      if (intent === "signin" && !existingUser) {
        return res.status(404).json({
          error: "No account found with this email. Create an account first.",
        });
      }

      if (intent === "signup" && existingUser) {
        return res.status(409).json({
          error: "An account with this email already exists. Sign in instead.",
        });
      }

      if (existingUser?.isBanned) {
        return res.status(403).json({ error: "This account has been banned" });
      }

      if (isTestAccount(email)) {
        return res.json({ message: "OTP sent to your email" });
      }

      const otp = generateOtp();

      await prisma.otp.deleteMany({ where: { email } });
      await prisma.otp.create({
        data: {
          email,
          code: hashOtp(email, otp),
          expiresAt: getOtpExpiry(),
        },
      });

      await sendOtpEmail(email, otp);

      res.json({ message: "OTP sent to your email" });
    } catch (error) {
      console.error("OTP send failed:", error);

      if (error.code === "EAUTH") {
        return res.status(503).json({
          error:
            "Email service authentication failed. Regenerate your Gmail App Password and update SMTP_PASSWORD in backend/.env, then restart the server.",
        });
      }

      res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }
  });

  router.post("/otp/verify", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const code = req.body.otp?.trim();
    const intent = parseAuthIntent(req.body.intent);

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Valid 6-digit OTP is required" });
    }

    try {
      const existingUser = await prisma.user.findFirst({
        where: { email, isDeleted: false },
        select: userSelect,
      });

      if (intent === "signin" && !existingUser) {
        return res.status(404).json({
          error: "No account found with this email. Create an account first.",
        });
      }

      if (intent === "signup" && existingUser) {
        return res.status(409).json({
          error: "An account with this email already exists. Sign in instead.",
        });
      }

      if (existingUser?.isBanned) {
        return res.status(403).json({ error: "This account has been banned" });
      }

      if (isTestAccount(email)) {
        if (code !== TEST_ACCOUNT_OTP) {
          return res.status(400).json({ error: "Invalid OTP" });
        }
      } else {
        const record = await prisma.otp.findFirst({
          where: { email },
          orderBy: { createdAt: "desc" },
        });

        if (!record) {
          return res.status(400).json({ error: "OTP not found. Request a new one." });
        }

        if (record.expiresAt < new Date()) {
          await prisma.otp.delete({ where: { id: record.id } });
          return res.status(400).json({ error: "OTP expired. Request a new one." });
        }

        if (record.code !== hashOtp(email, code)) {
          return res.status(400).json({ error: "Invalid OTP" });
        }
      }

      const user =
        intent === "signin"
          ? existingUser
          : await prisma.user.create({
              data: { email },
              select: userSelect,
            });

      await prisma.otp.deleteMany({ where: { email } });

      const token = setAuthCookie(res, user);

      res.json({
        message: "Signed in successfully",
        token,
        user: formatUser(user),
      });
    } catch (error) {
      console.error("OTP verify failed:", error);

      if (error.code === "P2002") {
        return res.status(409).json({
          error: "An account with this email already exists. Sign in instead.",
        });
      }

      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });
}

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: userSelect,
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.isDeleted) {
    clearAuthCookie(res);
    return res.status(410).json({ error: "This account has been permanently deleted" });
  }

  if (user.isBanned) {
    clearAuthCookie(res);
    return res.status(403).json({ error: "This account has been banned" });
  }

  res.json({ user: formatUser(user) });
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const updateData = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();
      updateData.name = name || null;
    }

    if (req.body.address !== undefined) {
      updateData.address = parseUserAddress(req.body.address);
    }

    if (req.body.email !== undefined) {
      const emailRaw = String(req.body.email || "")
        .trim()
        .toLowerCase();

      // Blank email means "leave unchanged". Do not write null — MongoDB
      // unique indexes (even sparse ones) treat null as a real value, so
      // only one user could otherwise have a missing email.
      if (emailRaw) {
        if (!isValidEmail(emailRaw)) {
          return res.status(400).json({ error: "Valid email is required" });
        }

        const existingEmailUser = await prisma.user.findFirst({
          where: { email: emailRaw },
          select: { id: true },
        });

        if (existingEmailUser && existingEmailUser.id !== req.user.id) {
          return res.status(409).json({
            error: "This email is already linked to another account.",
          });
        }

        updateData.email = emailRaw;
      }
    }

    const referralCodeRaw =
      req.body.referralCode !== undefined
        ? String(req.body.referralCode || "")
            .trim()
            .toUpperCase()
        : "";

    if (referralCodeRaw) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { referralCodeId: true },
      });

      if (!currentUser?.referralCodeId) {
        const referral = await prisma.referralCode.findFirst({
          where: { code: referralCodeRaw, isActive: true },
          select: { id: true },
        });

        if (!referral) {
          return res.status(400).json({
            error: "Invalid or inactive referral code",
          });
        }

        updateData.referralCodeId = referral.id;
        updateData.referralAppliedAt = new Date();
      }
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: "No profile fields to update" });
    }

    const user = await withPrismaRetry(() =>
      prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: userSelect,
      }),
    );

    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Profile update failed:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "This email is already linked to another account.",
      });
    }

    res.status(400).json({ error: error.message || "Failed to update profile" });
  }
});

router.patch("/role", requireAuth, async (req, res) => {
  const role = parseRole(req.body.role);

  if (!role) {
    return res.status(400).json({ error: "Role must be buyer or seller" });
  }

  try {
    const user = await withPrismaRetry(() =>
      prisma.user.update({
        where: { id: req.user.id },
        data: { role },
        select: userSelect,
      }),
    );

    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Role update failed:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.post("/delete-account", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        ...userSelect,
        isDeleted: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(409).json({ error: "This account has already been deleted" });
    }

    const deletedReason = String(req.body.reason || "").trim() || "User requested account deletion";
    const deletionContext = {
      userId: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      role: user.role ?? null,
      reason: deletedReason,
      ip: req.ip,
      userAgent: req.get("user-agent") || null,
    };

    authLogger.info("Account deletion requested", deletionContext);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedReason,
        phone: null,
      },
      select: userSelect,
    });

    authLogger.info("Account deleted", {
      ...deletionContext,
      deletedAt: updatedUser.deletedAt,
    });

    clearAuthCookie(res);

    res.json({
      message: "Account deleted successfully",
      user: formatUser(updatedUser),
    });
  } catch (error) {
    authLogger.error("Account deletion failed", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

export default router;
