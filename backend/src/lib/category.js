import { prisma } from "./prisma.js";

export const CATEGORY_ICON_ALLOWLIST = [
  { id: "construct-outline", label: "Metals / construction" },
  { id: "cube-outline", label: "Materials / polymers" },
  { id: "git-branch-outline", label: "Pipes / tubes" },
  { id: "cog-outline", label: "Machinery" },
  { id: "hardware-chip-outline", label: "Electrical" },
  { id: "flask-outline", label: "Chemicals" },
  { id: "layers-outline", label: "General / other" },
  { id: "document-text-outline", label: "Paper / documents" },
  { id: "water-outline", label: "Liquids / fluids" },
  { id: "leaf-outline", label: "Organic / rubber" },
  { id: "grid-outline", label: "Sheets / panels" },
  { id: "barbell-outline", label: "Heavy materials" },
  { id: "hammer-outline", label: "Tools / hardware" },
  { id: "car-outline", label: "Automotive" },
  { id: "home-outline", label: "Building materials" },
  { id: "flash-outline", label: "Power / energy" },
  { id: "thermometer-outline", label: "Temperature / HVAC" },
  { id: "beaker-outline", label: "Lab / scientific" },
  { id: "shield-outline", label: "Safety equipment" },
  { id: "boat-outline", label: "Marine / shipping" },
  { id: "nutrition-outline", label: "Food-grade / consumables" },
  { id: "ellipse-outline", label: "Rubber / round stock" },
  { id: "albums-outline", label: "Bundles / lots" },
  { id: "trail-sign-outline", label: "Industrial misc" },
];

const ALLOWED_ICON_IDS = new Set(CATEGORY_ICON_ALLOWLIST.map((item) => item.id));

export const CANONICAL_CATEGORIES = [
  { name: "Metals", icon: "construct-outline" },
  { name: "Polymers", icon: "cube-outline" },
  { name: "Pipes & Tubes", icon: "git-branch-outline" },
  { name: "Machinery", icon: "cog-outline" },
  { name: "Electrical", icon: "hardware-chip-outline" },
  { name: "Chemicals", icon: "flask-outline" },
  { name: "Other", icon: "layers-outline" },
];

export const ALLOWED_CATEGORY_NAMES = CANONICAL_CATEGORIES.map((item) => item.name);

export function slugifyCategory(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const ALLOWED_CATEGORY_SLUGS = new Map(
  CANONICAL_CATEGORIES.map((item) => [slugifyCategory(item.name), item.name]),
);

export function parseCategory(value) {
  const slug = slugifyCategory(value);
  if (!slug) {
    return null;
  }

  return ALLOWED_CATEGORY_SLUGS.get(slug) ?? null;
}

export function normalizeCategory(value) {
  const parsed = parseCategory(value);
  if (parsed) {
    return parsed;
  }

  const key = slugifyCategory(value);

  if (key.includes("metal")) return "Metals";
  if (key.includes("polymer") || key.includes("plastic")) return "Polymers";
  if (key.includes("pipe") || key.includes("tube")) return "Pipes & Tubes";
  if (key.includes("machin")) return "Machinery";
  if (key.includes("electronic") || key.includes("electrical")) return "Electrical";
  if (key.includes("chemical")) return "Chemicals";

  return "Other";
}

export function getAllowedCategories() {
  return CANONICAL_CATEGORIES.map(({ name, icon }) => ({ name, icon }));
}

export function isAllowedCategoryIcon(icon) {
  return ALLOWED_ICON_IDS.has(String(icon || "").trim());
}

export function suggestCategoryIcon(name) {
  const key = slugifyCategory(name);

  if (key.includes("metal")) return "construct-outline";
  if (key.includes("polymer") || key.includes("plastic")) return "cube-outline";
  if (key.includes("paper")) return "document-text-outline";
  if (key.includes("electronic") || key.includes("electrical")) return "hardware-chip-outline";
  if (key.includes("machin")) return "cog-outline";
  if (key.includes("pipe") || key.includes("tube")) return "git-branch-outline";
  if (key.includes("chemical")) return "flask-outline";
  if (key.includes("rubber")) return "ellipse-outline";

  for (const canonical of CANONICAL_CATEGORIES) {
    if (slugifyCategory(canonical.name) === key) {
      return canonical.icon;
    }
  }

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

async function getOrCreateCategoryMeta(name) {
  const displayName = String(name || "").trim();
  const slug = slugifyCategory(displayName);

  if (!displayName) {
    return null;
  }

  const existing = await prisma.categoryMeta.findUnique({ where: { slug } });
  if (existing) {
    return existing;
  }

  return upsertCategoryMeta(displayName);
}

export async function listCategoriesWithCounts() {
  const grouped = await prisma.product.groupBy({
    by: ["category"],
    _count: { category: true },
    orderBy: { category: "asc" },
  });

  const categories = await Promise.all(
    grouped.map(async (item) => {
      const meta = await getOrCreateCategoryMeta(item.category);

      return {
        name: item.category,
        count: item._count.category,
        icon: meta?.icon ?? suggestCategoryIcon(item.category),
      };
    }),
  );

  return categories;
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
    await getOrCreateCategoryMeta(category);
  }
}
