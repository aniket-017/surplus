import type {
  BrowseProductsParams,
  LocalImage,
  Product,
  ProductAnalysis,
  ProductCategory,
  ProductFormValues,
  ProductListing,
} from '@/src/types/product';
import { API_BASE } from '@/src/lib/apiBase';
import { prepareImageForUpload } from '@/src/lib/prepareImageForUpload';

type ApiError = { error?: string };

const MULTIPART_TIMEOUT_MS = 120_000;
const ANALYZE_TIMEOUT_MS = 180_000;

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

async function appendImages(formData: FormData, images: LocalImage[]) {
  for (const image of images) {
    const prepared = await prepareImageForUpload(image);
    formData.append('images', {
      uri: prepared.uri,
      name: prepared.name,
      type: prepared.type || 'image/jpeg',
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

/** Android-friendly multipart request (fetch FormData uploads often hang on content:// URIs). */
function sendFormData<T>(
  method: 'POST' | 'PATCH',
  path: string,
  token: string,
  formData: FormData,
  timeoutMs = MULTIPART_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    function fail(message: string) {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    }

    function succeed(data: T) {
      if (settled) return;
      settled = true;
      resolve(data);
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;

      let data: T & ApiError = {} as T & ApiError;
      try {
        data = JSON.parse(xhr.responseText || '{}') as T & ApiError;
      } catch {
        // keep empty object
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        succeed(data);
        return;
      }

      if (!xhr.status) {
        fail(
          'Connection lost while analyzing. Check Wi‑Fi, stay on this screen, and try again.',
        );
        return;
      }

      fail(data.error || `Request failed (${xhr.status})`);
    };

    xhr.onerror = () => {
      fail(`Network error: cannot reach server at ${API_BASE}`);
    };

    xhr.ontimeout = () => {
      fail('Request timed out. Please try again with fewer or clearer photos.');
    };

    xhr.open(method, `${API_BASE}${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = timeoutMs;
    xhr.send(formData);
  });
}

export async function analyzeProductImages(token: string, images: LocalImage[]) {
  const formData = new FormData();
  await appendImages(formData, images);
  return sendFormData<{ analysis: ProductAnalysis }>(
    'POST',
    '/api/products/analyze',
    token,
    formData,
    ANALYZE_TIMEOUT_MS,
  );
}

export async function createProduct(
  token: string,
  images: LocalImage[],
  values: ProductFormValues,
) {
  const formData = new FormData();
  await appendImages(formData, images);
  appendProductFields(formData, values);
  return sendFormData<{ product: Product }>('POST', '/api/products', token, formData);
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
    await appendImages(formData, images);
  }
  appendProductFields(formData, values);
  return sendFormData<{ product: Product }>('PATCH', `/api/products/${id}`, token, formData);
}

export async function markProductSold(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/products/${id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listingStatus: 'sold' }),
  });

  return parseResponse<{ product: Product }>(res);
}

export async function deleteProduct(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ product: Product; message: string }>(res);
}

function buildBrowseQuery(params: BrowseProductsParams = {}) {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.subCategory) query.set('subCategory', params.subCategory);
  if (params.sort) query.set('sort', params.sort);
  if (params.city) query.set('city', params.city);
  if (params.state) query.set('state', params.state);
  if (params.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
  if (params.condition) query.set('condition', params.condition);
  if (params.negotiable) query.set('negotiable', 'true');
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

export async function getProductSubCategories(token: string, category: string) {
  const query = new URLSearchParams({ category });
  const res = await fetch(`${API_BASE}/api/products/subcategories?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ subCategories: string[] }>(res);
}

export function getImageUrl(path: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
