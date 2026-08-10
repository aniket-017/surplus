import { prisma } from "./prisma.js";
import { formatCategoryEntry } from "./categoryAssets.js";

export const CATEGORY_ICON_ALLOWLIST = [
  { id: "construct-outline", label: "Metals" },
  { id: "cube-outline", label: "Plastics" },
  { id: "filter-outline", label: "Piping" },
  { id: "cog-outline", label: "Machinery" },
  { id: "hardware-chip-outline", label: "Electronics" },
  { id: "flask-outline", label: "Chemicals" },
  { id: "ellipse-outline", label: "Rubber" },
  { id: "albums-outline", label: "Packaging" },
  { id: "home-outline", label: "Construction" },
  { id: "shirt-outline", label: "Textiles" },
  { id: "leaf-outline", label: "Wood & Agro" },
  { id: "earth-outline", label: "Minerals" },
  { id: "flash-outline", label: "Energy" },
  { id: "shield-outline", label: "Safety" },
  { id: "layers-outline", label: "Others" },
  { id: "document-text-outline", label: "Paper / documents" },
  { id: "water-outline", label: "Liquids / fluids" },
  { id: "hammer-outline", label: "Tools / hardware" },
  { id: "car-outline", label: "Automotive" },
  { id: "thermometer-outline", label: "Temperature / HVAC" },
  { id: "beaker-outline", label: "Lab / scientific" },
  { id: "boat-outline", label: "Marine / shipping" },
  { id: "nutrition-outline", label: "Food-grade / consumables" },
  { id: "trail-sign-outline", label: "Industrial misc" },
];

const ALLOWED_ICON_IDS = new Set(CATEGORY_ICON_ALLOWLIST.map((item) => item.id));

export const CANONICAL_CATEGORIES = [
  { name: "Metals", icon: "construct-outline" },
  { name: "Plastics", icon: "cube-outline" },
  { name: "Piping", icon: "filter-outline" },
  { name: "Machinery", icon: "cog-outline" },
  { name: "Electronics", icon: "hardware-chip-outline" },
  { name: "Chemicals", icon: "flask-outline" },
  { name: "Rubber", icon: "ellipse-outline" },
  { name: "Packaging", icon: "albums-outline" },
  { name: "Construction", icon: "home-outline" },
  { name: "Textiles", icon: "shirt-outline" },
  { name: "Wood & Agro", icon: "leaf-outline" },
  { name: "Minerals", icon: "earth-outline" },
  { name: "Energy", icon: "flash-outline" },
  { name: "Safety", icon: "shield-outline" },
  { name: "Others", icon: "layers-outline" },
];

export const ALLOWED_CATEGORY_NAMES = CANONICAL_CATEGORIES.map((item) => item.name);

const CATEGORY_ICON_BY_NAME = new Map(
  CANONICAL_CATEGORIES.map((item) => [item.name, item.icon]),
);

export function slugifyCategory(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const ALLOWED_CATEGORY_SLUGS = new Map(
  CANONICAL_CATEGORIES.map((item) => [slugifyCategory(item.name), item.name]),
);

const LEGACY_CATEGORY_ALIASES = new Map([
  [slugifyCategory("Polymers"), "Plastics"],
  [slugifyCategory("Pipes & Tubes"), "Piping"],
  [slugifyCategory("Pipes and Tubes"), "Piping"],
  [slugifyCategory("Electrical"), "Electronics"],
  [slugifyCategory("Other"), "Others"],
]);

export function parseCategory(value) {
  const slug = slugifyCategory(value);
  if (!slug) {
    return null;
  }

  return (
    ALLOWED_CATEGORY_SLUGS.get(slug) ??
    LEGACY_CATEGORY_ALIASES.get(slug) ??
    null
  );
}

export function normalizeCategory(value) {
  const parsed = parseCategory(value);
  if (parsed) {
    return parsed;
  }

  const key = slugifyCategory(value);

  if (key.includes("metal")) return "Metals";
  if (key.includes("plastic") || key.includes("polymer")) return "Plastics";
  if (key.includes("pipe") || key.includes("tube") || key.includes("piping")) return "Piping";
  if (key.includes("machin")) return "Machinery";
  if (key.includes("electronic") || key.includes("electrical")) return "Electronics";
  if (key.includes("chemical")) return "Chemicals";
  if (key.includes("rubber")) return "Rubber";
  if (key.includes("packag")) return "Packaging";
  if (key.includes("construct") || key.includes("cement") || key.includes("concrete")) {
    return "Construction";
  }
  if (key.includes("textile") || key.includes("fabric") || key.includes("yarn")) return "Textiles";
  if (key.includes("wood") || key.includes("agro") || key.includes("timber")) return "Wood & Agro";
  if (key.includes("mineral") || key.includes("ore")) return "Minerals";
  if (key.includes("energy") || key.includes("solar") || key.includes("fuel") || key.includes("petroleum")) {
    return "Energy";
  }
  if (key.includes("safety") || key.includes("ppe")) return "Safety";

  return "Others";
}

export function getAllowedCategories() {
  return CANONICAL_CATEGORIES.map((canonical) => formatCategoryEntry(canonical));
}

export function isAllowedCategoryIcon(icon) {
  return ALLOWED_ICON_IDS.has(String(icon || "").trim());
}

export function suggestCategoryIcon(name) {
  const canonicalIcon = CATEGORY_ICON_BY_NAME.get(name);
  if (canonicalIcon) {
    return canonicalIcon;
  }

  const key = slugifyCategory(name);

  if (key.includes("metal")) return "construct-outline";
  if (key.includes("plastic") || key.includes("polymer")) return "cube-outline";
  if (key.includes("pipe") || key.includes("tube") || key.includes("piping")) return "filter-outline";
  if (key.includes("machin")) return "cog-outline";
  if (key.includes("electronic") || key.includes("electrical")) return "hardware-chip-outline";
  if (key.includes("chemical")) return "flask-outline";
  if (key.includes("rubber")) return "ellipse-outline";
  if (key.includes("packag")) return "albums-outline";
  if (key.includes("construct") || key.includes("cement")) return "home-outline";
  if (key.includes("textile") || key.includes("fabric")) return "shirt-outline";
  if (key.includes("wood") || key.includes("agro")) return "leaf-outline";
  if (key.includes("mineral") || key.includes("ore")) return "earth-outline";
  if (key.includes("energy") || key.includes("solar") || key.includes("fuel")) return "flash-outline";
  if (key.includes("safety") || key.includes("ppe")) return "shield-outline";
  if (key.includes("paper")) return "document-text-outline";

  return "layers-outline";
}

export function resolveCategoryIcon(name, explicitIcon) {
  const trimmed = String(explicitIcon || "").trim();
  if (trimmed && isAllowedCategoryIcon(trimmed)) {
    return trimmed;
  }

  return suggestCategoryIcon(name);
}

export function getCategoryIconAllowlist() {
  return CATEGORY_ICON_ALLOWLIST;
}

export async function upsertCategoryMeta(name, explicitIcon) {
  const displayName = String(name || "").trim();
  const slug = slugifyCategory(displayName);

  if (!displayName) {
    throw new Error("Category is required");
  }

  const existing = await prisma.categoryMeta.findUnique({ where: { slug } });
  const trimmedIcon = String(explicitIcon || "").trim();
  const hasExplicitIcon = trimmedIcon && isAllowedCategoryIcon(trimmedIcon);

  if (existing) {
    if (hasExplicitIcon && existing.icon !== trimmedIcon) {
      return prisma.categoryMeta.update({
        where: { slug },
        data: { icon: trimmedIcon },
      });
    }

    return existing;
  }

  const icon = resolveCategoryIcon(displayName, explicitIcon);

  return prisma.categoryMeta.create({
    data: {
      name: displayName,
      slug,
      icon,
    },
  });
}

export async function ensureCategoryMeta(name) {
  const displayName = String(name || "").trim();
  const slug = slugifyCategory(displayName);

  if (!displayName) {
    throw new Error("Category is required");
  }

  const existing = await prisma.categoryMeta.findUnique({ where: { slug } });
  if (existing) {
    return existing;
  }

  return upsertCategoryMeta(displayName, suggestCategoryIcon(displayName));
}

async function getOrCreateCategoryMeta(name, icon) {
  const displayName = String(name || "").trim();
  const slug = slugifyCategory(displayName);

  if (!displayName) {
    return null;
  }

  const existing = await prisma.categoryMeta.findUnique({ where: { slug } });
  if (existing) {
    return existing;
  }

  return upsertCategoryMeta(displayName, icon);
}

export async function listCategoriesWithCounts() {
  const grouped = await prisma.product.groupBy({
    by: ["category"],
    where: {
      listingStatus: "ACTIVE",
    },
    _count: { category: true },
  });

  const countByCanonical = new Map();

  for (const item of grouped) {
    const normalized = normalizeCategory(item.category);
    countByCanonical.set(
      normalized,
      (countByCanonical.get(normalized) ?? 0) + item._count.category,
    );
  }

  const categories = CANONICAL_CATEGORIES.map((canonical) =>
    formatCategoryEntry(canonical, countByCanonical.get(canonical.name) ?? 0),
  );

  return categories;
}

export async function listSubCategoriesForCategory(category) {
  const normalized = parseCategory(category);
  if (!normalized) {
    return [];
  }

  const grouped = await prisma.product.groupBy({
    by: ["subCategory"],
    where: {
      listingStatus: "ACTIVE",
      category: normalized,
    },
    _count: { subCategory: true },
    orderBy: {
      _count: {
        subCategory: "desc",
      },
    },
  });

  return grouped
    .map((item) => {
      const name = String(item.subCategory || "").trim();
      if (!name) return null;
      return {
        name,
        count: item._count.subCategory,
      };
    })
    .filter(Boolean);
}

export async function backfillCategoryMeta() {
  for (const canonical of CANONICAL_CATEGORIES) {
    await upsertCategoryMeta(canonical.name, canonical.icon);
  }

  const distinctCategories = await prisma.product.findMany({
    distinct: ["category"],
    select: { category: true },
  });

  for (const { category } of distinctCategories) {
    const normalized = normalizeCategory(category);
    const canonical = CANONICAL_CATEGORIES.find((item) => item.name === normalized);
    await getOrCreateCategoryMeta(normalized, canonical?.icon ?? suggestCategoryIcon(normalized));
  }
}
