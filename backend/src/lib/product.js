import { resolveProductImageUrls } from "./s3.js";
import { parseCategory } from "./category.js";

const PRICE_TYPES = ["FIXED", "NEGOTIABLE", "PER_KG", "PER_UNIT", "PER_LOT"];
const CONDITIONS = ["NEW", "USED", "SCRAP", "REFURBISHED"];

export function parsePriceType(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "PERKG") return "PER_KG";
  if (normalized === "PERUNIT") return "PER_UNIT";
  if (normalized === "PERLOT") return "PER_LOT";

  return PRICE_TYPES.includes(normalized) ? normalized : null;
}

export function parseCondition(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return CONDITIONS.includes(normalized) ? normalized : null;
}

export function parseAttributes(raw) {
  if (!raw) return [];

  let parsed = raw;
  if (typeof raw === "string") {
    parsed = JSON.parse(raw);
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item) => item?.key && item?.value)
    .map((item) => ({
      key: String(item.key).trim(),
      value: String(item.value).trim(),
    }));
}

export function parseLocation(raw) {
  let parsed = raw;
  if (typeof raw === "string") {
    parsed = JSON.parse(raw);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Location is required");
  }

  const location = {
    address: parsed.address ? String(parsed.address).trim() : null,
    city: String(parsed.city || "").trim(),
    state: String(parsed.state || "").trim(),
    pincode: String(parsed.pincode || "").trim(),
  };

  if (!location.city || !location.state || !location.pincode) {
    throw new Error("City, state, and pincode are required");
  }

  return location;
}

export function parseProductPayload(body) {
  const priceType = parsePriceType(body.priceType);
  const condition = parseCondition(body.condition);

  if (!priceType) {
    throw new Error("Invalid priceType");
  }

  if (!condition) {
    throw new Error("Invalid condition");
  }

  const quantity = Number(body.quantity);
  const price = Number(body.price);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Price must be greater than 0");
  }

  const title = String(body.title || "").trim();
  const category = parseCategory(body.category);
  const subCategory = String(body.subCategory || "").trim();
  const description = String(body.description || "").trim();
  const quantityUnit = String(body.quantityUnit || "").trim();

  if (!category) {
    throw new Error("Invalid category. Choose one of the allowed categories.");
  }

  if (!title || !subCategory || !description || !quantityUnit) {
    throw new Error("Title, category, subCategory, description, and quantityUnit are required");
  }

  return {
    title,
    category,
    subCategory,
    description,
    quantity,
    quantityUnit,
    price,
    priceType,
    condition,
    attributes: parseAttributes(body.attributes),
    location: parseLocation(body.location),
  };
}

export async function formatProduct(product) {
  const images = await resolveProductImageUrls(product.images);

  return {
    id: product.id,
    sellerId: product.sellerId,
    title: product.title,
    category: product.category,
    subCategory: product.subCategory,
    description: product.description,
    quantity: product.quantity,
    quantityUnit: product.quantityUnit,
    price: product.price,
    priceType: product.priceType.toLowerCase(),
    condition: product.condition.toLowerCase(),
    images,
    attributes: product.attributes,
    location: product.location,
    viewCount: product.viewCount ?? 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function formatSellerProducts(products, inquiryCountByProductId = new Map()) {
  return Promise.all(
    products.map(async (product) => ({
      ...(await formatProduct(product)),
      inquiryCount: inquiryCountByProductId.get(product.id) ?? 0,
    })),
  );
}

function formatSellerSummary(seller) {
  if (!seller) {
    return null;
  }

  return {
    id: seller.id,
    name: seller.name || seller.email.split("@")[0],
    email: seller.email,
    avatarUrl: seller.avatarUrl || null,
    memberSince: seller.createdAt ? seller.createdAt.toISOString() : null,
  };
}

export async function formatProductListing(product, seller) {
  const formatted = await formatProduct(product);

  return {
    ...formatted,
    seller: formatSellerSummary(seller),
  };
}

export function parseBrowseSort(value) {
  const sort = String(value || "recent").trim().toLowerCase();
  if (sort === "price_asc" || sort === "price_desc" || sort === "recent") {
    return sort;
  }

  return "recent";
}

export function buildBrowseOrderBy(sort) {
  if (sort === "price_asc") {
    return { price: "asc" };
  }

  if (sort === "price_desc") {
    return { price: "desc" };
  }

  return { createdAt: "desc" };
}

export function buildBrowseWhere({ search, category }) {
  const where = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { subCategory: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export { PRICE_TYPES, CONDITIONS };
