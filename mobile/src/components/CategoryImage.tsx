import { Image, type ImageStyle } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, type StyleProp } from 'react-native';

import {
  loadCategoryImageManifest,
  resolveCategoryImageUrl,
} from '@/src/lib/categoryImages';

type CategoryImageProps = {
  name: string;
  imageUrl?: string | null;
  style?: StyleProp<ImageStyle>;
};

export function CategoryImage({ name, imageUrl, style }: CategoryImageProps) {
  const [uri, setUri] = useState(() => resolveCategoryImageUrl(name, imageUrl));

  useEffect(() => {
    let cancelled = false;

    async function syncUri() {
      if (imageUrl) {
        setUri(resolveCategoryImageUrl(name, imageUrl));
        return;
      }

      await loadCategoryImageManifest();
      if (!cancelled) {
        setUri(resolveCategoryImageUrl(name));
      }
    }

    syncUri();

    return () => {
      cancelled = true;
    };
  }, [name, imageUrl]);

  return (
    <Image
      source={{ uri }}
      style={[styles.image, style]}
      contentFit="contain"
      cachePolicy="none"
      recyclingKey={uri}
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
