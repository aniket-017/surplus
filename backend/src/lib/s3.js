import path from "path";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REQUIRED_ENV = [
  "AWS_REGION",
  "AWS_BUCKET_NAME",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
];

let s3Client;

function getConfig() {
  return {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET_NAME,
    prefix: (process.env.AWS_S3_PREFIX || "products").replace(/^\/+|\/+$/g, ""),
    publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/+$/, ""),
  };
}

export function assertS3Config() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required AWS environment variables: ${missing.join(", ")}`);
  }
}

export function getS3Client() {
  assertS3Config();

  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
}

export function slugifySegment(value, fallback = "uncategorized") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || fallback;
}

export function buildProductImagePrefix(category, subCategory, productId) {
  const { prefix } = getConfig();
  const categorySlug = slugifySegment(category, "uncategorized");
  const subCategorySlug = slugifySegment(subCategory, "general");
  return `${prefix}/${categorySlug}/${subCategorySlug}/${productId}/`;
}

export function buildProductImageKey(category, subCategory, productId, index, ext) {
  const imagePrefix = buildProductImagePrefix(category, subCategory, productId);
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "") || ".jpg";
  const order = String(index + 1).padStart(2, "0");
  const filename = `${order}-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
  return `${imagePrefix}${filename}`;
}

export function getPublicUrl(key) {
  const { bucket, region, publicBaseUrl } = getConfig();

  if (publicBaseUrl) {
    return `${publicBaseUrl}/${key}`;
  }

  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export function extractKeyFromStoredUrl(storedUrl) {
  if (!storedUrl || typeof storedUrl !== "string") {
    return null;
  }

  if (storedUrl.startsWith("/uploads/")) {
    return null;
  }

  try {
    const { bucket, publicBaseUrl } = getConfig();
    const url = new URL(storedUrl);
    const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

    if (publicBaseUrl && storedUrl.startsWith(`${publicBaseUrl}/`)) {
      return storedUrl.slice(publicBaseUrl.length + 1);
    }

    if (url.hostname === "s3.amazonaws.com" || url.hostname.startsWith("s3.")) {
      const segments = pathname.split("/");
      if (segments[0] === bucket) {
        return segments.slice(1).join("/");
      }
    }

    return pathname || null;
  } catch {
    return null;
  }
}

export async function getReadableImageUrl(storedUrl) {
  if (!storedUrl) {
    return storedUrl;
  }

  if (storedUrl.startsWith("/uploads/")) {
    return storedUrl;
  }

  const key = extractKeyFromStoredUrl(storedUrl);
  if (!key) {
    return storedUrl;
  }

  const client = getS3Client();
  const { bucket } = getConfig();
  const expiresIn = Number(process.env.AWS_S3_PRESIGN_EXPIRES_SECONDS) || 60 * 60 * 24 * 7;

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn },
  );
}

export async function resolveProductImageUrls(images = []) {
  return Promise.all(images.map((image) => getReadableImageUrl(image)));
}

function extensionFromFile(file, index) {
  const fromName = path.extname(file.originalname || "");
  if (fromName) {
    return fromName;
  }

  const mimeExt = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };

  return mimeExt[file.mimetype] || `.jpg`;
}

export function buildMessageImageKey(conversationId, ext) {
  const { prefix } = getConfig();
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "") || ".webp";
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
  return `${prefix}/messages/${conversationId}/${filename}`;
}

export async function uploadMessageFile(conversationId, file) {
  const client = getS3Client();
  const { bucket } = getConfig();
  const ext = extensionFromFile(file, 0);
  const key = buildMessageImageKey(conversationId, ext);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return getPublicUrl(key);
}

export async function uploadMessageImage(conversationId, file) {
  const client = getS3Client();
  const { bucket } = getConfig();
  const ext = extensionFromFile(file, 0);
  const key = buildMessageImageKey(conversationId, ext);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return getPublicUrl(key);
}

export async function uploadProductImages(category, subCategory, productId, files) {
  const client = getS3Client();
  const { bucket } = getConfig();

  const uploads = files.map(async (file, index) => {
    const key = buildProductImageKey(
      category,
      subCategory,
      productId,
      index,
      extensionFromFile(file, index),
    );

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return getPublicUrl(key);
  });

  return Promise.all(uploads);
}

async function deleteObjectsByKeys(keys) {
  if (!keys.length) return 0;

  const client = getS3Client();
  const { bucket } = getConfig();

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
      },
    }),
  );

  return keys.length;
}

export async function deleteProductImages(imageUrls = []) {
  const keysFromUrls = imageUrls
    .map((url) => extractKeyFromStoredUrl(url))
    .filter(Boolean);

  if (!keysFromUrls.length) {
    return 0;
  }

  return deleteObjectsByKeys(keysFromUrls);
}
