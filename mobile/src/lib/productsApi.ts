import type {
  BrowseProductsParams,
  LocalImage,
  Product,
  ProductAnalysis,
  ProductCategory,
  ProductFormValues,
  ProductListing,
} from '@/src/types/product';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

type ApiError = { error?: string };

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

function appendImages(formData: FormData, images: LocalImage[]) {
  for (const image of images) {
    formData.append('images', {
      uri: image.uri,
      name: image.name,
      type: image.type,
    } as unknown as Blob);
  }
}

function appendProductFields(formData: FormData, values: ProductFormValues) {
  formData.append('title', values.title);
  formData.append('category', values.category);
  formData.append('subCategory', values.subCategory);
  formData.append('description', values.description);
  formData.append('quantityUnit', values.quantityUnit);
  formData.append('quantity', values.quantity);
  formData.append('price', values.price);
  formData.append('priceType', values.priceType);
  formData.append('condition', values.condition);
  formData.append('attributes', JSON.stringify(values.attributes));
  formData.append('location', JSON.stringify(values.location));
}

export async function analyzeProductImages(token: string, images: LocalImage[]) {
  const formData = new FormData();
  appendImages(formData, images);

  const res = await fetch(`${API_BASE}/api/products/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse<{ analysis: ProductAnalysis }>(res);
}

export async function createProduct(
  token: string,
  images: LocalImage[],
  values: ProductFormValues,
) {
  const formData = new FormData();
  appendImages(formData, images);
  appendProductFields(formData, values);

  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse<{ product: Product }>(res);
}

export type SellerDashboardStats = {
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
};

export async function getMyProducts(token: string) {
  const res = await fetch(`${API_BASE}/api/products/mine`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ products: Product[]; stats: SellerDashboardStats }>(res);
}

export async function getProduct(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ product: Product }>(res);
}

export async function updateProduct(
  token: string,
  id: string,
  values: ProductFormValues,
  images?: LocalImage[],
) {
  const formData = new FormData();
  if (images?.length) {
    appendImages(formData, images);
  }
  appendProductFields(formData, values);

  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse<{ product: Product }>(res);
}

function buildBrowseQuery(params: BrowseProductsParams = {}) {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.sort) query.set('sort', params.sort);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.skip) query.set('skip', String(params.skip));

  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function browseProducts(token: string, params: BrowseProductsParams = {}) {
  const res = await fetch(`${API_BASE}/api/products/browse${buildBrowseQuery(params)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ products: ProductListing[] }>(res);
}

export async function getBrowseProduct(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/products/browse/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ product: ProductListing }>(res);
}

export async function getProductCategories(token: string) {
  const res = await fetch(`${API_BASE}/api/products/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ categories: ProductCategory[] }>(res);
}

export function getImageUrl(path: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
