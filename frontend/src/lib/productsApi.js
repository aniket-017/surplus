const API_BASE = import.meta.env.VITE_API_URL || ''

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  return data
}

async function apiFetchForm(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
  })
  return parseResponse(res)
}

function buildBrowseQuery(params = {}) {
  const query = new URLSearchParams()

  if (params.search) query.set('search', params.search)
  if (params.category) query.set('category', params.category)
  if (params.sort) query.set('sort', params.sort)
  if (params.city) query.set('city', params.city)
  if (params.state) query.set('state', params.state)
  if (params.limit) query.set('limit', String(params.limit))
  if (params.skip) query.set('skip', String(params.skip))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

function appendProductFields(formData, values) {
  formData.append('title', values.title)
  formData.append('category', values.category)
  formData.append('subCategory', values.subCategory)
  formData.append('description', values.description)
  formData.append('quantityUnit', values.quantityUnit)
  formData.append('quantity', values.quantity)
  formData.append('price', values.price)
  formData.append('priceType', values.priceType)
  formData.append('condition', values.condition)
  formData.append('attributes', JSON.stringify(values.attributes))
  formData.append('location', JSON.stringify(values.location))
}

export function getImageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export async function browseProducts(params = {}) {
  const res = await fetch(`${API_BASE}/api/products/browse${buildBrowseQuery(params)}`, {
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function getBrowseProduct(id) {
  const res = await fetch(`${API_BASE}/api/products/browse/${id}`, {
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function getCategories() {
  const res = await fetch(`${API_BASE}/api/products/categories`, {
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function getMyProducts() {
  const res = await fetch(`${API_BASE}/api/products/mine`, {
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function getSellerProduct(id) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function analyzeProductImages(files) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('images', file)
  }

  return apiFetchForm('/api/products/analyze', {
    method: 'POST',
    body: formData,
  })
}

export async function createProduct(files, values) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('images', file)
  }
  appendProductFields(formData, values)

  return apiFetchForm('/api/products', {
    method: 'POST',
    body: formData,
  })
}
