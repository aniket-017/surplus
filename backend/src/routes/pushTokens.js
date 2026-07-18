import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function isExpoPushToken(token) {
  return typeof token === "string" && /^ExponentPushToken\[.+\]$/.test(token);
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const token = String(req.body.token || "").trim();
    const platform = req.body.platform ? String(req.body.platform).trim() : null;

    if (!isExpoPushToken(token)) {
      return res.status(400).json({ error: "A valid Expo push token is required" });
    }

    const record = await prisma.pushToken.upsert({
      where: { token },
      create: {
        userId: req.user.id,
        token,
        platform,
      },
      update: {
        userId: req.user.id,
        platform,
      },
    });

    res.json({
      token: {
        id: record.id,
        token: record.token,
        platform: record.platform,
      },
    });
  } catch (error) {
    console.error("Register push token failed:", error);
    res.status(500).json({ error: "Failed to register push token" });
  }
});

router.delete("/", requireAuth, async (req, res) => {
  try {
    const token = String(req.body.token || req.query.token || "").trim();

    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }

    await prisma.pushToken.deleteMany({
      where: {
        token,
        userId: req.user.id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Unregister push token failed:", error);
    res.status(500).json({ error: "Failed to unregister push token" });
  }
});

export default router;
