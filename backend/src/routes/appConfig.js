import { Router } from "express";
import {
  DEFAULT_SHARE_APP_MESSAGE,
  getAppConfig,
  getLegalConfig,
  getLegalDefaults,
} from "../lib/appSettings.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    res.json(await getAppConfig());
  } catch (error) {
    console.error("App config read failed:", error);
    res.json({ shareAppMessage: DEFAULT_SHARE_APP_MESSAGE, updatedAt: null });
  }
});

router.get("/legal", async (_req, res) => {
  try {
    res.json(await getLegalConfig());
  } catch (error) {
    console.error("Legal config read failed:", error);
    res.json(getLegalDefaults());
  }
});

export default router;
