import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getImageUrl } from '@/src/lib/productsApi';
import { getServiceCategoryTheme } from '@/src/lib/serviceCategories';

type ServiceThumbnailProps = {
  image?: string | null;
  category: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

/** First work-sample photo, else the category photo, else a tinted category icon. */
export function ServiceThumbnail({ image, category, iconSize = 30, style }: ServiceThumbnailProps) {
  if (image) {
    return (
      <View style={[styles.base, style]}>
        <Image source={{ uri: getImageUrl(image) }} style={styles.fill} contentFit="cover" />
      </View>
    );
  }

  const theme = getServiceCategoryTheme(category);

  if (theme.image) {
    return (
      <View style={[styles.base, style]}>
        <Image source={theme.image} style={styles.fill} contentFit="cover" />
      </View>
    );
  }

  return (
    <View style={[styles.base, styles.fallback, { backgroundColor: theme.tint }, style]}>
      <Ionicons
        name={theme.icon as keyof typeof Ionicons.glyphMap}
        size={iconSize}
        color={theme.color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
