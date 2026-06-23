import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const CATEGORY_ASSETS_DIR = path.join(__dirname, "../assets/categories");

const CATEGORY_IMAGE_FILES = {
  Metals: "Metals.png",
  Plastics: "Plastics.png",
  Piping: "Piping.png",
  Machinery: "Machinery.png",
  Electronics: "Electronics.png",
  Chemicals: "Chemicals.png",
  Rubber: "Rubber.png",
  Packaging: "Packaging.png",
  Construction: "Construction.png",
  Textiles: "Textiles.png",
  "Wood & Agro": "Wood & Agro.png",
  Minerals: "Minerals.png",
  Energy: "Energy.png",
  Safety: "Safety.png",
  Others: "Others.png",
};

export function getCategoryImageFilename(categoryName) {
  return CATEGORY_IMAGE_FILES[categoryName] ?? null;
}

export function getCategoryImagePath(categoryName) {
  const filename = getCategoryImageFilename(categoryName);
  if (!filename) {
    return null;
  }

  return `/api/assets/categories/${encodeURIComponent(filename)}`;
}

export function formatCategoryEntry(canonical, count) {
  const entry = {
    name: canonical.name,
    icon: canonical.icon,
    imageUrl: getCategoryImagePath(canonical.name),
  };

  if (count !== undefined) {
    entry.count = count;
  }

  return entry;
}
