import { Router } from "express";
import passport from "../config/passport.js";
import { isGoogleAuthEnabled, isOtpAuthEnabled, getAuthMethods, getFirebaseWebConfig } from "../config/auth.js";
import { prisma } from "../lib/prisma.js";
import { withPrismaRetry } from "../lib/prismaRetry.js";
import {
  setAuthCookie,
  clearAuthCookie,
  formatUser,
  parseUserAddress,
  userSelect,
} from "../lib/auth.js";
import { sendOtpEmail } from "../lib/mail.js";
import { generateOtp, hashOtp, getOtpExpiry, isValidEmail } from "../lib/otp.js";
import {
  getFirebaseErrorCode,
  isFirebaseAuthConfigured,
  verifyFirebaseIdToken,
} from "../lib/firebaseAdmin.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Test account for Play Store app review: no email is sent, a fixed OTP is accepted.
const TEST_ACCOUNT_EMAIL = "aniketkhillare17@gmail.com";
const TEST_ACCOUNT_OTP = "123456";

function isTestAccount(email) {
  return email === TEST_ACCOUNT_EMAIL;
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

async function findUserByPhoneOrFirebaseUid(phone, firebaseUid) {
  return prisma.user.findFirst({
    where: {
      OR: [{ phone }, { firebaseUid }],
    },
    select: userSelect,
  });
}

router.get("/methods", (_req, res) => {
  res.json(getAuthMethods());
});

router.get("/firebase-config", (_req, res) => {
  const config = getFirebaseWebConfig();
  if (!config) {
    return res.status(503).json({
      error:
        "Firebase web config is missing. Set FIREBASE_WEB_API_KEY, FIREBASE_WEB_AUTH_DOMAIN, FIREBASE_WEB_APP_ID (and FIREBASE_PROJECT_ID) in backend/.env.",
    });
  }
  res.json(config);
});

if (isGoogleAuthEnabled()) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

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
    }
  );
}

router.post("/firebase/phone", async (req, res) => {
  if (!isFirebaseAuthConfigured()) {
    return res.status(503).json({
      error: "Phone authentication is not configured on the server.",
    });
  }

  const idToken = typeof req.body.idToken === "string" ? req.body.idToken.trim() : "";

  if (!idToken) {
    return res.status(400).json({ error: "Firebase ID token is required" });
  }

  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    const firebaseUid = decoded.uid;
    const phone = decoded.phone_number;

    if (!firebaseUid || !phone) {
      return res.status(400).json({
        error: "Firebase token is missing a verified phone number.",
      });
    }

    const existingUser = await findUserByPhoneOrFirebaseUid(phone, firebaseUid);

    if (existingUser?.isBanned) {
      return res.status(403).json({ error: "This account has been banned" });
    }

    let user = existingUser;

    if (!existingUser) {
      user = await prisma.user.create({
        data: {
          phone,
          firebaseUid,
        },
        select: userSelect,
      });
    } else if (
      existingUser.phone !== phone ||
      existingUser.firebaseUid !== firebaseUid
    ) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          phone,
          firebaseUid,
        },
        select: userSelect,
      });
    }

    const token = setAuthCookie(res, user);

    res.json({
      message: "Signed in successfully",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Firebase phone auth failed:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "An account with this phone number already exists.",
      });
    }

    const firebaseCode = getFirebaseErrorCode(error);

    if (
      firebaseCode === "auth/id-token-expired" ||
      firebaseCode === "auth/argument-error" ||
      firebaseCode === "auth/invalid-id-token" ||
      firebaseCode === "auth/invalid-token"
    ) {
      return res.status(401).json({ error: "Invalid or expired Firebase token" });
    }

    if (
      String(error.message || "").includes("Failed to parse private key") ||
      String(error.message || "").includes("error:1E08010C") ||
      firebaseCode === "app/invalid-credential"
    ) {
      return res.status(503).json({
        error:
          "Phone authentication is misconfigured on the server. Check FIREBASE_PRIVATE_KEY in backend/.env.",
      });
    }

    res.status(500).json({
      error: error.message
        ? `Failed to sign in with phone number: ${error.message}`
        : "Failed to sign in with phone number",
    });
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
        where: { email },
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
        where: { email },
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
      const emailRaw = String(req.body.email || "").trim().toLowerCase();

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
        ? String(req.body.referralCode || "").trim().toUpperCase()
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
      })
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
      })
    );

    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Role update failed:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

export default router;
