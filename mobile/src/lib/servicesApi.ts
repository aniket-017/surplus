import { API_BASE } from '@/src/lib/apiBase';
import {
  ANALYZE_TIMEOUT_MS,
  appendImages,
  parseResponse,
  sendFormData,
} from '@/src/lib/productsApi';
import type { LocalImage } from '@/src/types/product';
import type {
  BrowseServicesParams,
  SellerServiceStats,
  Service,
  ServiceAiDraft,
  ServiceCategory,
  ServiceFormValues,
  ServiceListing,
  ServicePhotoAnalysis,
  ServiceQualityIssue,
} from '@/src/types/service';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function postJson<T>(token: string, path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function draftServiceFromText(
  token: string,
  input: { text?: string; category?: string; title?: string; description?: string },
) {
  const { draft } = await postJson<{ draft: ServiceAiDraft }>(token, '/api/services/ai/draft', input);
  return draft;
}

export async function analyzeServicePhotos(token: string, images: LocalImage[]) {
  const formData = new FormData();
  await appendImages(formData, images);
  const { analysis } = await sendFormData<{ analysis: ServicePhotoAnalysis }>(
    'POST',
    '/api/services/ai/analyze-photos',
    token,
    formData,
    ANALYZE_TIMEOUT_MS,
  );
  return analysis;
}

export async function suggestServiceCapabilities(
  token: string,
  input: { category: string; title: string; description: string; existing: string[] },
) {
  const { suggestions } = await postJson<{ suggestions: string[] }>(
    token,
    '/api/services/ai/capabilities',
    input,
  );
  return suggestions;
}

export async function checkServiceQuality(
  token: string,
  form: ServiceFormValues,
  photoCount: number,
) {
  const { issues } = await postJson<{ issues: ServiceQualityIssue[] }>(
    token,
    '/api/services/ai/quality-check',
    { form: { ...form, photoCount } },
  );
  return issues;
}

function appendServiceFields(formData: FormData, values: ServiceFormValues) {
  formData.append('title', values.title.trim());
  formData.append('category', values.category);
  formData.append('description', values.description.trim());
  formData.append('priceType', values.priceType);
  formData.append('price', values.priceType === 'quote' ? '0' : values.price.trim());
  formData.append('minimumCharge', values.minimumCharge.trim());
  formData.append('capabilities', JSON.stringify(values.capabilities));
  formData.append('experienceYears', values.experienceYears.trim());
  formData.append('turnaround', values.turnaround.trim());
  formData.append('serviceMode', values.serviceMode);
  formData.append('location', JSON.stringify(values.location));
}

export async function createService(
  token: string,
  images: LocalImage[],
  values: ServiceFormValues,
) {
  const formData = new FormData();
  await appendImages(formData, images);
  appendServiceFields(formData, values);
  return sendFormData<{ service: Service }>('POST', '/api/services', token, formData);
}

export async function updateService(
  token: string,
  id: string,
  values: ServiceFormValues,
  options: { images?: LocalImage[]; clearImages?: boolean } = {},
) {
  const formData = new FormData();
  if (options.images?.length) {
    await appendImages(formData, options.images);
  } else if (options.clearImages) {
    formData.append('clearImages', 'true');
  }
  appendServiceFields(formData, values);
  return sendFormData<{ service: Service }>('PATCH', `/api/services/${id}`, token, formData);
}

export async function getMyServices(token: string) {
  const res = await fetch(`${API_BASE}/api/services/mine`, { headers: authHeaders(token) });
  return parseResponse<{ services: Service[]; stats: SellerServiceStats }>(res);
}

export async function getService(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/services/${id}`, { headers: authHeaders(token) });
  return parseResponse<{ service: Service }>(res);
}

export async function setServiceStatus(token: string, id: string, status: 'active' | 'paused') {
  const res = await fetch(`${API_BASE}/api/services/${id}/status`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingStatus: status }),
  });
  return parseResponse<{ service: Service }>(res);
}

export async function deleteService(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/services/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return parseResponse<{ service: Service; message: string }>(res);
}

function buildBrowseQuery(params: BrowseServicesParams = {}) {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.sort) query.set('sort', params.sort);
  if (params.city) query.set('city', params.city);
  if (params.state) query.set('state', params.state);
  if (params.serviceMode) query.set('serviceMode', params.serviceMode);
  if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.skip) query.set('skip', String(params.skip));

  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function browseServices(token: string, params: BrowseServicesParams = {}) {
  const res = await fetch(`${API_BASE}/api/services/browse${buildBrowseQuery(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse<{ services: ServiceListing[] }>(res);
}

export async function getBrowseService(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/services/browse/${id}`, {
    headers: authHeaders(token),
  });
  return parseResponse<{ service: ServiceListing }>(res);
}

export async function getSimilarServices(token: string, id: string, limit = 6) {
  const res = await fetch(`${API_BASE}/api/services/browse/${id}/similar?limit=${limit}`, {
    headers: authHeaders(token),
  });
  return parseResponse<{ services: ServiceListing[] }>(res);
}

export async function getServiceCategories(token: string) {
  const res = await fetch(`${API_BASE}/api/services/categories`, {
    headers: authHeaders(token),
  });
  return parseResponse<{ categories: ServiceCategory[] }>(res);
}
