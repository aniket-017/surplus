import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryImage } from '@/src/components/CategoryImage';
import { categoryGridColumns } from '@/src/constants/layout';
import { cardShadow, colors, fonts } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';

const GAP = 12;
const HORIZONTAL_PADDING = 16;

export const CATEGORY_GRID_GAP = GAP;
export const CATEGORY_GRID_PADDING = HORIZONTAL_PADDING;
export const CATEGORY_CARD_RADIUS = 18;

export function getCategoryTileWidth(screenWidth: number, columns?: number) {
  const cols = columns ?? categoryGridColumns(screenWidth);
  // Floor so tiles + gaps never exceed the row width (avoids early wrap to fewer columns).
  return Math.floor((screenWidth - HORIZONTAL_PADDING * 2 - GAP * (cols - 1)) / cols);
}

function formatCount(count: number) {
  if (!Number.isFinite(count) || count <= 0) return null;
  const label = count === 1 ? 'item' : 'items';
  return `${count.toLocaleString('en-IN')} ${label}`;
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
  count,
  onPress,
  tileWidth: tileWidthProp,
}: BuyerCategoryCardProps) {
  const { width: screenWidth, categoryColumns, contentMaxWidth } = useBreakpoint();
  const layoutWidth = Math.min(screenWidth, contentMaxWidth);
  const tileWidth = tileWidthProp ?? getCategoryTileWidth(layoutWidth, categoryColumns);
  const countLabel = formatCount(count);

  return (
    <View style={[styles.shadow, { width: tileWidth, height: tileWidth }]}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && Platform.OS === 'ios' && styles.cardPressed,
        ]}
        onPress={onPress}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.15)' }}
        accessibilityRole="button"
        accessibilityLabel={countLabel ? `${name}, ${countLabel}` : name}
      >
        <CategoryImage
          name={name}
          imageUrl={imageUrl}
          contentFit="cover"
          style={styles.image}
        />
        <LinearGradient
          colors={['transparent', 'rgba(15, 27, 45, 0.55)', 'rgba(15, 27, 45, 0.85)']}
          locations={[0, 0.45, 1]}
          style={styles.gradient}
        />
        <View style={styles.labelBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {countLabel ? (
            <Text style={styles.count} numberOfLines={1}>
              {countLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: CATEGORY_CARD_RADIUS,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  card: {
    flex: 1,
    borderRadius: CATEGORY_CARD_RADIUS,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  labelBlock: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 1,
  },
  name: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
  count: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 11,
    lineHeight: 13,
    fontFamily: fonts.medium,
  },
});
