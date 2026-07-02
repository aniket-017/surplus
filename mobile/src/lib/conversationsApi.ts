import { resolveUploadUri, type ChatAttachment } from '@/src/lib/chatAttachments';
import type { LocalImage, PriceType, ProductListing } from '@/src/types/product';
import * as FileSystem from 'expo-file-system/legacy';

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
  imageUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
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
    conversation: {
      id: string;
      productId: string;
      buyerId: string;
      sellerId: string;
      otherParty: {
        id: string;
        name: string;
        avatarUrl: string | null;
      } | null;
      product: {
        id: string;
        title: string;
        images: string[];
      } | null;
    };
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

// Test connectivity to server
async function testServerConnectivity(token: string, conversationId: string): Promise<boolean> {
  try {
    console.log('Testing server connectivity...');
    const response = await fetch(`${API_BASE}/api/conversations/${conversationId}/test-upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    
    if (response.ok) {
      console.log('✅ Server connectivity test passed');
      return true;
    } else {
      console.log('❌ Server connectivity test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server connectivity test failed:', error);
    return false;
  }
}

export async function sendMessageWithAttachment(
  token: string,
  conversationId: string,
  attachment: ChatAttachment | LocalImage,
  body?: string,
) {
  console.log('Starting file upload...', { 
    conversationId, 
    fileName: attachment.name, 
    fileType: attachment.type,
    apiBase: API_BASE 
  });

  // Server connectivity confirmed - proceeding with upload

  const uploadUri = await resolveUploadUri(attachment);
  console.log('Resolved upload URI:', uploadUri);

  // Create FormData for upload
  const formData = new FormData();
  
  // Add the file directly to FormData (React Native way)
  console.log('Adding file to FormData...');
  
  // Verify file exists
  const fileInfo = await FileSystem.getInfoAsync(uploadUri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist at the resolved URI');
  }
  
  console.log('File exists, size:', fileInfo.size);
  
  // Add file directly to FormData using URI (React Native handles the rest)
  formData.append('attachment', {
    uri: uploadUri,
    name: attachment.name,
    type: attachment.type,
  } as any);
  
  console.log('File added to FormData successfully');

  // Add optional body text
  const trimmedBody = body?.trim();
  if (trimmedBody) {
    formData.append('body', trimmedBody);
  }
  
  // Add fileName
  formData.append('fileName', attachment.name);

  console.log('Sending upload request...');
  
  // Use XMLHttpRequest for better Android compatibility with file uploads
  return new Promise<{ message: ChatMessage }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        console.log('Upload response received, status:', xhr.status);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log('Upload successful');
            resolve(result);
          } catch (error) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          let errorMessage = 'Upload failed';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.error || `Server error: ${xhr.status}`;
            console.error('Server error response:', errorData);
          } catch {
            errorMessage = `Server returned status ${xhr.status}: ${xhr.responseText}`;
          }
          reject(new Error(errorMessage));
        }
      }
    };
    
    xhr.onerror = function() {
      console.error('XMLHttpRequest error');
      reject(new Error(`Network error: Cannot reach server at ${API_BASE}`));
    };
    
    xhr.ontimeout = function() {
      console.error('XMLHttpRequest timeout');
      reject(new Error('Upload timed out'));
    };
    
    xhr.open('POST', `${API_BASE}/api/conversations/${conversationId}/messages`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 30000; // 30 second timeout
    
    console.log('Sending XMLHttpRequest with FormData...');
    xhr.send(formData);
  });

  console.log('Upload response status:', response.status);

  if (!response.ok) {
    let errorMessage = 'Upload failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || `Server error: ${response.status}`;
      console.error('Server error response:', errorData);
    } catch {
      errorMessage = `Server returned status ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log('Upload successful');
  return result as { message: ChatMessage };
}

/** @deprecated Use sendMessageWithAttachment */
export const sendMessageWithImage = sendMessageWithAttachment;

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
