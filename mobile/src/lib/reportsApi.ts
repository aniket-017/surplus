import { API_BASE } from '@/src/lib/apiBase';

type ApiError = { error?: string };

export type ReportReason =
  | 'SPAM'
  | 'MISLEADING'
  | 'PROHIBITED'
  | 'WRONG_CATEGORY'
  | 'OTHER';

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export async function reportListing(
  token: string,
  productId: string,
  payload: { reason: ReportReason; details?: string },
) {
  const res = await fetch(`${API_BASE}/api/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      reason: payload.reason,
      details: payload.details?.trim() || undefined,
    }),
  });

  return parseResponse<{
    report: {
      id: string;
      productId: string;
      reason: ReportReason;
      details: string | null;
      status: string;
      createdAt: string;
    };
  }>(res);
}
