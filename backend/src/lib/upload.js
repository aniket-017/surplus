import multer from "multer";

export const MAX_PRODUCT_IMAGES = Number(process.env.MAX_PRODUCT_IMAGES) || 5;

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
}

export const uploadProductImages = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    files: MAX_PRODUCT_IMAGES,
    fileSize: 8 * 1024 * 1024,
  },
}).array("images", MAX_PRODUCT_IMAGES);
