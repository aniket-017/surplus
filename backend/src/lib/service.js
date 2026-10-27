import { resolveProductImageUrls } from "./s3.js";
import { formatSellerSummary, getListingStatus, parseLocation } from "./product.js";
import { parseServiceCategory } from "./serviceCategories.js";

export const SERVICE_PRICE_TYPES = ["PER_HOUR", "PER_PIECE", "PER_JOB", "PER_KG", "QUOTE"];
export const SERVICE_MODES = ["WORKSHOP", "ONSITE", "BOTH"];
export const SERVICE_STATUSES = ["ACTIVE", "PAUSED"];
export const MAX_CAPABILITIES = 12;

export const ACTIVE_SERVICE_WHERE = {
  listingType: "SERVICE",
  listingStatus: "ACTIVE",
};

export function parseServicePriceType(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return SERVICE_PRICE_TYPES.includes(normalized) ? normalized : null;
}

export function parseServiceMode(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
  return SERVICE_MODES.includes(normalized) ? normalized : null;
}

export function parseServiceStatus(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return SERVICE_STATUSES.includes(normalized) ? normalized : null;
}

function parseJsonArray(raw) {
  if (raw === undefined || raw === null || raw === "") return [];
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw.split(",");
    }
  }
  return Array.isArray(parsed) ? parsed : [];
}

function parseCapabilities(raw) {
  const seen = new Set();
  const capabilities = [];

  for (const item of parseJsonArray(raw)) {
    const value = String(item || "").trim().slice(0, 60);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    capabilities.push(value);
    if (capabilities.length >= MAX_CAPABILITIES) break;
  }

  return capabilities;
}

function parseOptionalNumber(raw, label, { integer = false } = {}) {
  if (raw === undefined || raw === null || raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return integer ? Math.round(value) : value;
}

function parseOptionalText(raw, maxLength) {
  const value = String(raw ?? "").trim();
  return value ? value.slice(0, maxLength) : null;
}

export function parseServicePayload(body) {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const category = parseServiceCategory(body.category);
  const priceType = parseServicePriceType(body.priceType);
  const serviceMode = parseServiceMode(body.serviceMode);

  if (!title || !description) {
    throw new Error("Title and description are required");
  }

  if (!category) {
    throw new Error("Invalid service category");
  }

  if (!priceType) {
    throw new Error("Invalid price type");
  }

  if (!serviceMode) {
    throw new Error("Service mode must be workshop, onsite, or both");
  }

  let price = 0;
  if (priceType !== "QUOTE") {
    price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Rate must be greater than 0");
    }
  }

  return {
    title,
    description,
    category,
    subCategory: category,
    price,
    priceType,
    attributes: [],
    location: parseLocation(body.location),
    serviceDetails: {
      capabilities: parseCapabilities(body.capabilities),
      experienceYears: parseOptionalNumber(body.experienceYears, "Experience", { integer: true }),
      serviceMode,
      turnaround: parseOptionalText(body.turnaround, 80),
      minimumCharge: parseOptionalNumber(body.minimumCharge, "Minimum charge"),
    },
  };
}

export function serviceBodyWithFallback(body, existing) {
  const details = existing.serviceDetails ?? {};
  const pick = (key, fallback) => (body[key] !== undefined ? body[key] : fallback);

  return {
    title: pick("title", existing.title),
    description: pick("description", existing.description),
    category: pick("category", existing.category),
    priceType: pick("priceType", existing.priceType),
    price: pick("price", existing.price),
    location: pick("location", existing.location),
    capabilities: pick("capabilities", details.capabilities ?? []),
    experienceYears: pick("experienceYears", details.experienceYears),
    serviceMode: pick("serviceMode", details.serviceMode),
    turnaround: pick("turnaround", details.turnaround),
    minimumCharge: pick("minimumCharge", details.minimumCharge),
  };
}

export async function formatService(service) {
  const images = await resolveProductImageUrls(service.images ?? []);
  const details = service.serviceDetails ?? {};

  return {
    id: service.id,
    listingType: "service",
    sellerId: service.sellerId,
    title: service.title,
    category: service.category,
    description: service.description,
    price: service.price,
    priceType: String(service.priceType).toLowerCase(),
    listingStatus: getListingStatus(service).toLowerCase(),
    images,
    location: service.location,
    capabilities: details.capabilities ?? [],
    experienceYears: details.experienceYears ?? null,
    serviceMode: details.serviceMode ? String(details.serviceMode).toLowerCase() : "workshop",
    turnaround: details.turnaround ?? null,
    minimumCharge: details.minimumCharge ?? null,
    viewCount: service.viewCount ?? 0,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

export async function formatServiceListing(service, seller) {
  return {
    ...(await formatService(service)),
    seller: formatSellerSummary(seller),
  };
}

export function parseServiceSort(value) {
  const sort = String(value || "recent").trim().toLowerCase();
  return sort === "price_asc" ? "price_asc" : "recent";
}

export function buildServiceOrderBy(sort) {
  if (sort === "price_asc") {
    return [{ price: "asc" }, { createdAt: "desc" }];
  }
  return { createdAt: "desc" };
}

export function buildServiceBrowseWhere({
  search,
  category,
  city,
  state,
  serviceMode,
  sort,
  maxPrice,
}) {
  const where = { ...ACTIVE_SERVICE_WHERE };

  if (category) {
    where.category = category;
  }

  if (city) {
    where.location = { is: { city: { equals: city, mode: "insensitive" } } };
  } else if (state) {
    where.location = { is: { state: { equals: state, mode: "insensitive" } } };
  }

  if (serviceMode && serviceMode !== "BOTH") {
    where.serviceDetails = {
      is: { serviceMode: { in: [serviceMode, "BOTH"] } },
    };
  }

  // Quote-only services have no rate to compare, so they drop out of rate sorting/filtering.
  if (sort === "price_asc" || Number.isFinite(maxPrice)) {
    where.priceType = { not: "QUOTE" };
    if (Number.isFinite(maxPrice)) {
      where.price = { lte: maxPrice };
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { serviceDetails: { is: { capabilities: { has: search } } } },
    ];
  }

  return where;
}
