import { optimizeProductImage } from "../lib/imageOptimize.js";
import { createLogger, describeUploadFile } from "../lib/logger.js";
import { uploadProductImages } from "../lib/upload.js";

const uploadLog = createLogger("listing-upload");

export function handleListingImageUpload(req, res, next) {
  uploadProductImages(req, res, (error) => {
    if (error) {
      uploadLog.error("Multer upload failed", error);
      return res.status(400).json({ error: error.message || "Invalid image upload" });
    }

    uploadLog.info("Images received by multer", {
      count: req.files?.length ?? 0,
      images: req.files?.map((file, index) => describeUploadFile(file, index)) ?? [],
    });
    next();
  });
}

export async function optimizeListingImages(req, res, next) {
  try {
    if (req.files?.length) {
      req.files = await Promise.all(
        req.files.map((file, index) => optimizeProductImage(file, index)),
      );
      uploadLog.info("Images ready after optimization", {
        count: req.files.length,
        images: req.files.map((file, index) => describeUploadFile(file, index)),
      });
    }
    next();
  } catch (error) {
    uploadLog.error("Image optimization middleware failed", error);
    res.status(400).json({ error: error.message || "Failed to process images" });
  }
}
