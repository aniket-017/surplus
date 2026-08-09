import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, type StyleProp } from 'react-native';

import { getCategoryImageSource } from '@/src/lib/categoryImages';

type CategoryImageProps = {
  name: string;
  imageUrl?: string | null;
  style?: StyleProp<ImageStyle>;
};

export function CategoryImage({ name, style }: CategoryImageProps) {
  const source = getCategoryImageSource(name);

  if (!source) {
    return null;
  }

  return (
    <Image
      source={source}
      style={[styles.image, style]}
      contentFit="contain"
      recyclingKey={name}
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
