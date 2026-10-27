import { prisma } from "./prisma.js";

export const SERVICE_CATEGORIES = [
  { name: "CNC / VMC Machining", icon: "cog-outline" },
  { name: "Turning & Lathe Work", icon: "sync-outline" },
  { name: "Welding", icon: "flame-outline" },
  { name: "Fabrication", icon: "construct-outline" },
  { name: "Sheet Metal & Laser Cutting", icon: "flash-outline" },
  { name: "Press Shop / Stamping", icon: "contract-outline" },
  { name: "Grinding", icon: "disc-outline" },
  { name: "Heat Treatment", icon: "thermometer-outline" },
  { name: "Plating / Powder Coating / Painting", icon: "color-palette-outline" },
  { name: "Tool & Die Making", icon: "hammer-outline" },
  { name: "Casting & Forging", icon: "bonfire-outline" },
  { name: "Plastic Injection Moulding", icon: "cube-outline" },
  { name: "Machine Repair & Maintenance", icon: "build-outline" },
  { name: "Electrical & Automation (PLC)", icon: "hardware-chip-outline" },
  { name: "Inspection & Testing (CMM)", icon: "scan-outline" },
  { name: "Industrial Transport", icon: "car-outline" },
  { name: "Others", icon: "layers-outline" },
];

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const SERVICE_CATEGORY_BY_SLUG = new Map(
  SERVICE_CATEGORIES.map((item) => [slugify(item.name), item.name]),
);

export function parseServiceCategory(value) {
  return SERVICE_CATEGORY_BY_SLUG.get(slugify(value)) ?? null;
}

export function getServiceCategories() {
  return SERVICE_CATEGORIES.map((item) => ({ name: item.name, icon: item.icon }));
}

export async function listServiceCategoriesWithCounts() {
  const grouped = await prisma.product.groupBy({
    by: ["category"],
    where: {
      listingType: "SERVICE",
      listingStatus: "ACTIVE",
    },
    _count: { category: true },
  });

  const countByName = new Map(
    grouped.map((item) => [item.category, item._count.category]),
  );

  return SERVICE_CATEGORIES.map((item) => ({
    name: item.name,
    icon: item.icon,
    count: countByName.get(item.name) ?? 0,
  }));
}
