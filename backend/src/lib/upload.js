import multer from "multer";

export const MAX_PRODUCT_IMAGES = Number(process.env.MAX_PRODUCT_IMAGES) || 5;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const DOCUMENT_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const ATTACHMENT_EXTENSIONS = /\.(jpe?g|png|webp|gif|heic|heif|pdf|docx?|xlsx?|txt)$/i;

function productFileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
}

function messageAttachmentFilter(_req, file, cb) {
  const mime = (file.mimetype || "").toLowerCase();
  const name = file.originalname || "";

  if (mime.startsWith("image/") || IMAGE_MIMES.has(mime) || DOCUMENT_MIMES.has(mime)) {
    return cb(null, true);
  }

  if (mime === "application/octet-stream" && ATTACHMENT_EXTENSIONS.test(name)) {
    return cb(null, true);
  }

  cb(new Error("Only images and documents (PDF, Word, Excel, TXT) are allowed"));
}

export const uploadProductImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: productFileFilter,
  limits: {
    files: MAX_PRODUCT_IMAGES,
    fileSize: 8 * 1024 * 1024,
  },
}).array("images", MAX_PRODUCT_IMAGES);

export const uploadMessageAttachment = multer({
  storage: multer.memoryStorage(),
  fileFilter: messageAttachmentFilter,
  limits: {
    files: 1,
    fileSize: 8 * 1024 * 1024,
  },
}).any();

export function getMessageUploadFile(req) {
  // Handle both .any() and .fields() responses
  if (Array.isArray(req.files)) {
    return req.files[0] ?? null;
  }
  return req.files?.attachment?.[0] ?? req.files?.image?.[0] ?? req.file ?? null;
}

export function isImageUpload(file) {
  const mime = (file.mimetype || "").toLowerCase();
  if (mime.startsWith("image/") || IMAGE_MIMES.has(mime)) {
    return true;
  }

  return mime === "application/octet-stream" && /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.originalname || "");
}
