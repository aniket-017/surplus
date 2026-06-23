import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, type StyleProp } from 'react-native';

import { resolveCategoryImageUrl } from '@/src/lib/categoryImages';

type CategoryImageProps = {
  name: string;
  imageUrl?: string | null;
  style?: StyleProp<ImageStyle>;
};

export function CategoryImage({ name, imageUrl, style }: CategoryImageProps) {
  return (
    <Image
      source={{ uri: resolveCategoryImageUrl(name, imageUrl) }}
      style={[styles.image, style]}
      contentFit="contain"
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
