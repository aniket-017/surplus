import type { PriceType, ProductListing } from '@/src/types/product';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

type ApiError = { error?: string };

export type ConversationSummary = {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    images: string[];
    price: number;
    priceType: string;
  } | null;
  otherParty: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  lastMessage: {
    body: string | null;
    senderId: string;
    createdAt: string;
  } | null;
  lastMessageAt: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  createdAt: string;
};

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export async function startInquiry(token: string, productId: string, message?: string) {
  const res = await fetch(`${API_BASE}/api/conversations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, message: message?.trim() || undefined }),
  });

  return parseResponse<{ conversationId: string; message: ChatMessage }>(res);
}

export async function getConversations(token: string) {
  const res = await fetch(`${API_BASE}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<{ conversations: ConversationSummary[] }>(res);
}

export async function getConversationMessages(token: string, conversationId: string) {
  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<{
    conversation: { id: string; productId: string; buyerId: string; sellerId: string };
    messages: ChatMessage[];
  }>(res);
}

export async function sendMessage(token: string, conversationId: string, body: string) {
  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  return parseResponse<{ message: ChatMessage }>(res);
}

export async function toggleSavedListing(token: string, productId: string) {
  const res = await fetch(`${API_BASE}/api/saved/${productId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<{ saved: boolean }>(res);
}

export async function getSavedStatus(token: string, productId: string) {
  const res = await fetch(`${API_BASE}/api/saved/${productId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<{ saved: boolean }>(res);
}

export async function getProductStats(token: string, productId: string) {
  const res = await fetch(`${API_BASE}/api/products/browse/${productId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<{ inquiryCount: number; savedCount: number }>(res);
}

export async function getSimilarProducts(token: string, productId: string, limit = 6) {
  const res = await fetch(`${API_BASE}/api/products/browse/${productId}/similar?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<{ products: ProductListing[] }>(res);
}

export function computeMarketRange(
  products: Pick<ProductListing, 'price' | 'priceType'>[],
  priceType: PriceType,
) {
  const matching = products.filter((p) => p.priceType === priceType && p.price > 0);
  if (matching.length < 2) return null;

  const prices = matching.map((p) => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}
