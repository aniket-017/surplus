import path from "path";
import sharp from "sharp";
import { createLogger, describeUploadFile } from "./logger.js";

const log = createLogger("image-optimize");

const MAX_DIMENSION = Number(process.env.IMAGE_MAX_DIMENSION) || 1200;
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY) || 80;

function webpFilename(originalname) {
  const base = path.basename(originalname || "image.jpg", path.extname(originalname || ""));
  return `${base || "image"}.webp`;
}

async function isAnimatedGif(buffer) {
  try {
    const metadata = await sharp(buffer, { animated: true }).metadata();
    return metadata.pages != null && metadata.pages > 1;
  } catch {
    return false;
  }
}

export async function optimizeProductImage(file, index = 0) {
  if (!file?.buffer) {
    log.error("Missing buffer on uploaded file", new Error("Uploaded image buffer is missing"));
    throw new Error("Uploaded image buffer is missing");
  }

  const before = describeUploadFile(file, index);
  log.info("Optimizing image", before);

  if (file.mimetype === "image/gif" && (await isAnimatedGif(file.buffer))) {
    log.info("Skipping animated GIF", before);
    return file;
  }

  try {
    const buffer = await sharp(file.buffer)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const optimized = {
      ...file,
      buffer,
      mimetype: "image/webp",
      originalname: webpFilename(file.originalname),
    };

    log.info("Image optimized", {
      ...before,
      after: describeUploadFile(optimized, index),
    });

    return optimized;
  } catch (error) {
    log.warn("Optimization failed, using original", {
      ...before,
      reason: error.message,
    });
    return file;
  }
}
