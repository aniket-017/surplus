import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

export const MAX_PRODUCT_IMAGES = Number(process.env.MAX_PRODUCT_IMAGES) || 5;
export const UPLOAD_ROOT = path.resolve(
  backendRoot,
  process.env.UPLOAD_DIR || "uploads/products"
);

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const tempDir = path.join(UPLOAD_ROOT, "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
}

export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: {
    files: MAX_PRODUCT_IMAGES,
    fileSize: 8 * 1024 * 1024,
  },
}).array("images", MAX_PRODUCT_IMAGES);

export function getPublicUrl(relativePath) {
  return `/uploads/products/${relativePath.replace(/\\/g, "/")}`;
}

export function moveImagesToProductFolder(productId, files) {
  const productDir = path.join(UPLOAD_ROOT, productId);
  fs.mkdirSync(productDir, { recursive: true });

  return files.map((file) => {
    const dest = path.join(productDir, file.filename);
    fs.renameSync(file.path, dest);
    return getPublicUrl(`${productId}/${file.filename}`);
  });
}

export function deleteProductImages(imageUrls) {
  for (const url of imageUrls) {
    const relative = url.replace(/^\/uploads\/products\//, "");
    const fullPath = path.join(UPLOAD_ROOT, relative);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  const productIds = [
    ...new Set(
      imageUrls
        .map((url) => url.match(/\/uploads\/products\/([^/]+)\//)?.[1])
        .filter(Boolean)
    ),
  ];

  for (const productId of productIds) {
    const dir = path.join(UPLOAD_ROOT, productId);
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  }
}

export function cleanupTempFiles(files = []) {
  for (const file of files) {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
}
