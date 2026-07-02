import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export type ChatAttachment = {
  uri: string;
  name: string;
  type: string;
};

export function guessAttachmentMimeType(name: string, fallback = 'application/octet-stream') {
  const ext = name.split('.').pop()?.toLowerCase();

  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    heif: 'image/heif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };

  return ext && map[ext] ? map[ext] : fallback;
}

export function buildAttachmentFromUri(uri: string, name: string, type?: string | null): ChatAttachment {
  const safeName = name.trim() || `attachment-${Date.now()}`;
  return {
    uri,
    name: safeName,
    type: type?.trim() || guessAttachmentMimeType(safeName, 'image/jpeg'),
  };
}

function extensionFromName(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext && ext.length <= 5) return ext;
  return 'jpg';
}

/** Copy content:// / ph:// URIs to cache so Android can upload them reliably. */
export async function resolveUploadUri(attachment: ChatAttachment): Promise<string> {
  const { uri, name } = attachment;
  
  console.log('Resolving upload URI:', { originalUri: uri, name });

  // For web or already accessible file URIs, return as-is
  if (Platform.OS === 'web' || uri.startsWith('file://')) {
    const info = await FileSystem.getInfoAsync(uri).catch(() => null);
    if (info?.exists) {
      console.log('URI is directly accessible');
      return uri;
    }
  }

  // For Android content:// URIs or iOS ph:// URIs, copy to cache first
  const needsCopy =
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://') ||
    !uri.startsWith('file://');

  if (needsCopy) {
    console.log('Copying URI to cache for upload compatibility');
    const ext = extensionFromName(name);
    const dest = `${FileSystem.cacheDirectory}chat-upload-${Date.now()}.${ext}`;
    
    try {
      await FileSystem.copyAsync({ from: uri, to: dest });
      console.log('Successfully copied to cache:', dest);
      return dest;
    } catch (error) {
      console.error('Failed to copy file to cache:', error);
      // If copying fails, try the original URI anyway
      return uri;
    }
  }

  return uri;
}
