import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CategoryImage } from '@/src/components/CategoryImage';
import { colors } from '@/src/constants/theme';

const COLUMNS = 3;
const GAP = 12;
const HORIZONTAL_PADDING = 16;

export const CATEGORY_GRID_GAP = GAP;
export const CATEGORY_GRID_PADDING = HORIZONTAL_PADDING;

export function getCategoryTileWidth(screenWidth: number) {
  return (screenWidth - HORIZONTAL_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
}

type BuyerCategoryCardProps = {
  name: string;
  icon?: string;
  imageUrl?: string | null;
  count: number;
  onPress: () => void;
};

export function BuyerCategoryCard({ name, imageUrl, onPress }: BuyerCategoryCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const tileWidth = getCategoryTileWidth(screenWidth);

  return (
    <Pressable
      style={[styles.card, { width: tileWidth }]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(15, 27, 45, 0.06)' }}
    >
      <View style={styles.iconWrap}>
        <CategoryImage name={name} imageUrl={imageUrl} style={styles.image} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'center',
    width: '100%',
  },
});
