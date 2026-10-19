import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CategoryImage } from '@/src/components/CategoryImage';
import { SkeletonBone } from '@/src/components/SkeletonBone';
import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';
import type { ProductCategory } from '@/src/types/product';

/** ~2.9 full cards + peek of the next for wider, readable tiles. */
const VISIBLE_CARDS = 2.9;
const CARD_GAP = 10;
const SCREEN_PADDING = 20;
const CARD_RADIUS = 18;
const SKELETON_COUNT = 4;

type CategoryCarouselProps = {
  categories: ProductCategory[];
  onSelectCategory: (category: string) => void;
  loading?: boolean;
  selectedCategory?: string;
};

function withMachineryBeforePlastics(categories: ProductCategory[]) {
  const plasticsIndex = categories.findIndex((c) => c.name === 'Plastics');
  const machineryIndex = categories.findIndex((c) => c.name === 'Machinery');
  if (plasticsIndex === -1 || machineryIndex === -1) return categories;

  const ordered = [...categories];
  ordered[plasticsIndex] = categories[machineryIndex];
  ordered[machineryIndex] = categories[plasticsIndex];
  return ordered;
}

function formatCount(count?: number) {
  if (count == null || !Number.isFinite(count) || count <= 0) return null;
  const label = count === 1 ? 'item' : 'items';
  return `${count.toLocaleString('en-IN')} ${label}`;
}

export function CategoryCarousel({
  categories,
  onSelectCategory,
  loading = false,
  selectedCategory,
}: CategoryCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - SCREEN_PADDING * 2;
  const cardWidth =
    (contentWidth - CARD_GAP * Math.floor(VISIBLE_CARDS)) / VISIBLE_CARDS;
  const showSkeleton = loading && categories.length === 0;
  const orderedCategories = withMachineryBeforePlastics(categories);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Pressable
          onPress={() => onSelectCategory('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="View all categories"
        >
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {showSkeleton
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <SkeletonBone
                key={`cat-skel-${i}`}
                width={cardWidth}
                height={cardWidth}
                radius={CARD_RADIUS}
                delay={i * 60}
              />
            ))
          : orderedCategories.map((category) => {
              const selected = selectedCategory === category.name;
              const countLabel = formatCount(category.count);

              return (
                <Pressable
                  key={category.name}
                  style={[
                    styles.card,
                    { width: cardWidth, height: cardWidth },
                    selected && styles.cardSelected,
                  ]}
                  onPress={() => onSelectCategory(category.name)}
                  accessibilityRole="button"
                  accessibilityLabel={category.name}
                >
                  <CategoryImage
                    name={category.name}
                    imageUrl={category.imageUrl}
                    contentFit="cover"
                    style={styles.image}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(15, 27, 45, 0.55)', 'rgba(15, 27, 45, 0.82)']}
                    locations={[0, 0.45, 1]}
                    style={styles.gradient}
                  />
                  <View style={styles.labelBlock}>
                    <Text style={styles.label} numberOfLines={1}>
                      {category.name}
                    </Text>
                    {countLabel ? (
                      <Text style={styles.count} numberOfLines={1}>
                        {countLabel}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textStrong,
    fontSize: 16,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
  viewAll: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  row: {
    gap: CARD_GAP,
    paddingRight: spacing.sm,
    paddingVertical: 2,
  },
  card: {
    position: 'relative',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: 'transparent',
    ...cardShadow,
  },
  cardSelected: {
    borderColor: colors.accent,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
  },
  labelBlock: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 1,
  },
  label: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 17,
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
