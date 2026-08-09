import { API_BASE } from '@/src/lib/apiBase';

let manifest: Record<string, number> = {};
let manifestLoaded = false;
let manifestPromise: Promise<Record<string, number>> | null = null;

export async function loadCategoryImageManifest(force = false) {
  if (manifestLoaded && !force) {
    return manifest;
  }

  if (manifestPromise && !force) {
    return manifestPromise;
  }

  manifestPromise = fetch(`${API_BASE}/api/assets/categories/manifest`)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to load category image manifest');
      }

      manifest = (await res.json()) as Record<string, number>;
      manifestLoaded = true;
      return manifest;
    })
    .catch(() => manifest)
    .finally(() => {
      manifestPromise = null;
    });

  return manifestPromise;
}

export function getCategoryImageVersion(categoryName: string) {
  return manifest[categoryName] ?? null;
}

export function getCategoryImagePath(categoryName: string, version?: number | null) {
  const resolvedVersion = version ?? getCategoryImageVersion(categoryName);
  const base = `/api/assets/categories/${encodeURIComponent(`${categoryName}.png`)}`;

  return resolvedVersion ? `${base}?v=${resolvedVersion}` : base;
}

export function resolveCategoryImageUrl(
  category: string | { name: string; imageUrl?: string | null },
  imageUrl?: string | null,
) {
  const explicit = imageUrl ?? (typeof category === 'object' ? category.imageUrl : undefined);

  if (explicit) {
    if (explicit.startsWith('http')) {
      return explicit;
    }

    return `${API_BASE}${explicit}`;
  }

  const name = typeof category === 'string' ? category : category.name;
  return `${API_BASE}${getCategoryImagePath(name)}`;
}
