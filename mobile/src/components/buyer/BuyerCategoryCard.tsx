import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryImage } from '@/src/components/CategoryImage';
import { categoryGridColumns } from '@/src/constants/layout';
import { colors } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';

const GAP = 12;
const HORIZONTAL_PADDING = 16;

export const CATEGORY_GRID_GAP = GAP;
export const CATEGORY_GRID_PADDING = HORIZONTAL_PADDING;

export function getCategoryTileWidth(screenWidth: number, columns?: number) {
  const cols = columns ?? categoryGridColumns(screenWidth);
  return (screenWidth - HORIZONTAL_PADDING * 2 - GAP * (cols - 1)) / cols;
}

type BuyerCategoryCardProps = {
  name: string;
  icon?: string;
  imageUrl?: string | null;
  count: number;
  onPress: () => void;
  /** When provided, avoids nested useBreakpoint in large grids. */
  tileWidth?: number;
};

export function BuyerCategoryCard({
  name,
  imageUrl,
  onPress,
  tileWidth: tileWidthProp,
}: BuyerCategoryCardProps) {
  const { width: screenWidth, categoryColumns, contentMaxWidth } = useBreakpoint();
  const layoutWidth = Math.min(screenWidth, contentMaxWidth);
  const tileWidth = tileWidthProp ?? getCategoryTileWidth(layoutWidth, categoryColumns);

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
