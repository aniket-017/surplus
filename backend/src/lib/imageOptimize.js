import path from "path";
import sharp from "sharp";

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

export async function optimizeProductImage(file) {
  if (!file?.buffer) {
    throw new Error("Uploaded image buffer is missing");
  }

  if (file.mimetype === "image/gif" && (await isAnimatedGif(file.buffer))) {
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

    return {
      ...file,
      buffer,
      mimetype: "image/webp",
      originalname: webpFilename(file.originalname),
    };
  } catch (error) {
    console.warn("Image optimization failed, using original:", error.message);
    return file;
  }
}
