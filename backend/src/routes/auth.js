import { Router } from "express";
import passport from "../config/passport.js";
import { isGoogleAuthEnabled, isOtpAuthEnabled, getAuthMethods } from "../config/auth.js";
import { prisma } from "../lib/prisma.js";
import { setAuthCookie, clearAuthCookie, formatUser, signToken, userSelect } from "../lib/auth.js";
import { sendOtpEmail } from "../lib/mail.js";
import { generateOtp, hashOtp, getOtpExpiry, isValidEmail } from "../lib/otp.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function parseRole(role) {
  const normalized = role?.trim().toLowerCase();
  if (normalized === "buyer") return "BUYER";
  if (normalized === "seller") return "SELLER";
  return null;
}

router.get("/methods", (_req, res) => {
  res.json(getAuthMethods());
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
      setAuthCookie(res, req.user);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?success=true`);
    }
  );
}

if (isOtpAuthEnabled()) {
  router.post("/otp/send", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    try {
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

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Valid 6-digit OTP is required" });
    }

    try {
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

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
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

  res.json({ user: formatUser(user) });
});

router.patch("/role", requireAuth, async (req, res) => {
  const role = parseRole(req.body.role);

  if (!role) {
    return res.status(400).json({ error: "Role must be buyer or seller" });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { role },
      select: userSelect,
    });

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
