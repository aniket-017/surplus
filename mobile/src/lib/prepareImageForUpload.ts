import { Image } from 'react-native';

import type { LocalImage } from '@/src/types/product';
import { resolveUploadUri } from '@/src/lib/chatAttachments';

const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.7;

function jpegName(name: string) {
  const base = name.replace(/\.[^.]+$/, '') || `photo-${Date.now()}`;
  return `${base}.jpg`;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

/**
 * Resize + compress before multipart upload so analyze/publish
 * stay fast on Android (avoids large-body XHR aborts).
 */
export async function prepareImageForUpload(image: LocalImage): Promise<LocalImage> {
  const sourceUri = await resolveUploadUri(image);

  try {
    // Lazy import so a stale native build doesn't crash the whole app at load time.
    const ImageManipulator = await import('expo-image-manipulator');
    const size = await getImageSize(sourceUri).catch(() => null);
    const actions: ImageManipulator.Action[] = [];

    if (size && Math.max(size.width, size.height) > MAX_EDGE) {
      if (size.width >= size.height) {
        actions.push({ resize: { width: MAX_EDGE } });
      } else {
        actions.push({ resize: { height: MAX_EDGE } });
      }
    }

    const result = await ImageManipulator.manipulateAsync(sourceUri, actions, {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      uri: result.uri,
      name: jpegName(image.name),
      type: 'image/jpeg',
    };
  } catch (error) {
    console.warn('Image compression failed, uploading original', error);
    return {
      ...image,
      uri: sourceUri,
    };
  }
}
