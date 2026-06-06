import type {
  LocalImage,
  Product,
  ProductAnalysis,
  ProductFormValues,
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

export async function getMyProducts(token: string) {
  const res = await fetch(`${API_BASE}/api/products/mine`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ products: Product[] }>(res);
}

export function getImageUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}
