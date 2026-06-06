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
  const category = String(body.category || "").trim();
  const subCategory = String(body.subCategory || "").trim();
  const description = String(body.description || "").trim();
  const quantityUnit = String(body.quantityUnit || "").trim();

  if (!title || !category || !subCategory || !description || !quantityUnit) {
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

export function formatProduct(product) {
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
    images: product.images,
    attributes: product.attributes,
    location: product.location,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export { PRICE_TYPES, CONDITIONS };
