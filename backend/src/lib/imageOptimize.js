import path from "path";
import sharp from "sharp";
import { createLogger, describeUploadFile } from "./logger.js";

const log = createLogger("image-optimize");

const MAX_DIMENSION = Number(process.env.IMAGE_MAX_DIMENSION) || 1200;
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY) || 80;
const TARGET_SIZE_BYTES = (Number(process.env.IMAGE_TARGET_SIZE_KB) || 100) * 1024;
const MIN_QUALITY = 20;
const MIN_DIMENSION = 160;

function webpFilename(originalname) {
  const base = path.basename(originalname || "image.jpg", path.extname(originalname || ""));
  return `${base || "image"}.webp`;
}

function encodeWebp(buffer, dimension, quality) {
  return sharp(buffer)
    .rotate()
    .resize(dimension, dimension, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}

async function compressToTarget(buffer) {
  let dimension = MAX_DIMENSION;
  let compressed = await encodeWebp(buffer, dimension, WEBP_QUALITY);

  if (compressed.length <= TARGET_SIZE_BYTES) {
    return { buffer: compressed, dimension, quality: WEBP_QUALITY };
  }

  compressed = await encodeWebp(buffer, dimension, MIN_QUALITY);

  while (compressed.length > TARGET_SIZE_BYTES && dimension > MIN_DIMENSION) {
    dimension = Math.max(MIN_DIMENSION, Math.floor(dimension * 0.8));
    compressed = await encodeWebp(buffer, dimension, MIN_QUALITY);
  }

  if (compressed.length > TARGET_SIZE_BYTES) {
    compressed = await encodeWebp(buffer, MIN_DIMENSION, 1);
    return { buffer: compressed, dimension: MIN_DIMENSION, quality: 1 };
  }

  let best = compressed;
  let bestQuality = MIN_QUALITY;
  let low = MIN_QUALITY + 1;
  let high = WEBP_QUALITY;

  while (low <= high) {
    const quality = Math.floor((low + high) / 2);
    const candidate = await encodeWebp(buffer, dimension, quality);

    if (candidate.length <= TARGET_SIZE_BYTES) {
      best = candidate;
      bestQuality = quality;
      low = quality + 1;
    } else {
      high = quality - 1;
    }
  }

  return { buffer: best, dimension, quality: bestQuality };
}

export async function optimizeProductImage(file, index = 0) {
  if (!file?.buffer) {
    log.error("Missing buffer on uploaded file", new Error("Uploaded image buffer is missing"));
    throw new Error("Uploaded image buffer is missing");
  }

  const before = describeUploadFile(file, index);
  log.info("Optimizing image", before);

  try {
    const result = await compressToTarget(file.buffer);
    if (result.buffer.length > TARGET_SIZE_BYTES) {
      throw new Error("Image remains above the configured size target");
    }

    const optimized = {
      ...file,
      buffer: result.buffer,
      size: result.buffer.length,
      mimetype: "image/webp",
      originalname: webpFilename(file.originalname),
    };

    log.info("Image optimized", {
      ...before,
      after: describeUploadFile(optimized, index),
      targetBytes: TARGET_SIZE_BYTES,
      outputDimension: result.dimension,
      outputQuality: result.quality,
    });

    return optimized;
  } catch (error) {
    log.error("Optimization failed", error, {
      ...before,
    });
    throw new Error("Uploaded image could not be compressed");
  }
}
