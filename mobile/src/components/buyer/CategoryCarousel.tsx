import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CategoryImage } from '@/src/components/CategoryImage';
import { SkeletonBone } from '@/src/components/SkeletonBone';
import { colors, spacing } from '@/src/constants/theme';
import type { ProductCategory } from '@/src/types/product';

/** Show ~4 full cards + a sliver of the next to hint horizontal scroll. */
const VISIBLE_CARDS = 4.2;
const CARD_GAP = spacing.xs;
const SCREEN_PADDING = spacing.lg;
const SKELETON_COUNT = 5;

type CategoryCarouselProps = {
  categories: ProductCategory[];
  onSelectCategory: (category: string) => void;
  loading?: boolean;
};

export function CategoryCarousel({
  categories,
  onSelectCategory,
  loading = false,
}: CategoryCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - SCREEN_PADDING * 2;
  const cardWidth =
    (contentWidth - CARD_GAP * Math.floor(VISIBLE_CARDS)) / VISIBLE_CARDS;
  const iconSize = Math.round(cardWidth * 0.68);
  const showSkeleton = loading && categories.length === 0;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse by Category</Text>
        <Pressable onPress={() => onSelectCategory('')}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {showSkeleton
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <View key={`cat-skel-${i}`} style={[styles.card, { width: cardWidth }]}>
                <SkeletonBone
                  width={iconSize}
                  height={iconSize}
                  radius={10}
                  delay={i * 60}
                />
                <SkeletonBone width="70%" height={11} radius={6} delay={i * 60 + 40} />
              </View>
            ))
          : categories.map((category) => (
              <Pressable
                key={category.name}
                style={[styles.card, { width: cardWidth }]}
                onPress={() => onSelectCategory(category.name)}
              >
                <View style={[styles.iconWrap, { width: iconSize, height: iconSize }]}>
                  <CategoryImage
                    name={category.name}
                    imageUrl={category.imageUrl}
                    style={styles.image}
                  />
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
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
    fontSize: 18,
    fontWeight: '800',
  },
  viewAll: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    gap: CARD_GAP,
    paddingRight: spacing.sm,
  },
  card: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: 4,
  },
  iconWrap: {
    borderRadius: 10,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    color: colors.textStrong,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
