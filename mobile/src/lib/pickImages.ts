import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export type PickedImage = {
  uri: string;
  name: string;
  mimeType: string | null | undefined;
};

type PickImagesOptions = {
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
  quality?: number;
  permissionMessage?: string;
};

/**
 * Android's system PhotoPicker can reject with "Failed to parse PhotoPicker result"
 * (especially under Expo Go / after a modal dismiss). Prefer the legacy picker on
 * Android and always swallow native rejections so they don't surface as uncaught.
 */
export async function pickImagesFromLibrary(
  options: PickImagesOptions = {},
): Promise<PickedImage[] | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permission required',
      options.permissionMessage || 'Allow photo library access to continue.',
    );
    return null;
  }

  const baseOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsMultipleSelection: options.allowsMultipleSelection ?? false,
    selectionLimit: options.selectionLimit,
    quality: options.quality ?? 0.85,
    ...(Platform.OS === 'android' ? { legacy: true } : null),
  };

  try {
    const result = await ImagePicker.launchImageLibraryAsync(baseOptions);

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    return result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `photo-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType,
    }));
  } catch (error) {
    // Retry once without legacy if the first attempt failed for another reason.
    if (Platform.OS === 'android' && baseOptions.legacy) {
      try {
        const retry = await ImagePicker.launchImageLibraryAsync({
          ...baseOptions,
          legacy: false,
        });
        if (retry.canceled || !retry.assets?.length) {
          return null;
        }
        return retry.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName || `photo-${Date.now()}-${index}.jpg`,
          mimeType: asset.mimeType,
        }));
      } catch {
        // fall through to alert
      }
    }

    console.warn('Image picker failed:', error);
    Alert.alert(
      'Could not open photos',
      'Please try again, or attach the file using Document instead.',
    );
    return null;
  }
}
