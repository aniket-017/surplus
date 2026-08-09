import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CategoryImage } from '@/src/components/CategoryImage';
import { colors, spacing } from '@/src/constants/theme';
import type { ProductCategory } from '@/src/types/product';

/** Show ~4 full cards + a sliver of the next to hint horizontal scroll. */
const VISIBLE_CARDS = 4.2;
const CARD_GAP = spacing.xs;
const SCREEN_PADDING = spacing.lg;

type CategoryCarouselProps = {
  categories: ProductCategory[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
};

export function CategoryCarousel({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - SCREEN_PADDING * 2;
  const cardWidth =
    (contentWidth - CARD_GAP * Math.floor(VISIBLE_CARDS)) / VISIBLE_CARDS;
  const iconSize = Math.round(cardWidth * 0.68);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse by Category</Text>
        <Pressable onPress={() => onSelectCategory('')}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((category) => {
          const active = activeCategory === category.name;

          return (
            <Pressable
              key={category.name}
              style={[styles.card, { width: cardWidth }, active && styles.cardActive]}
              onPress={() => onSelectCategory(active ? '' : category.name)}
            >
              <View
                style={[
                  styles.iconWrap,
                  { width: iconSize, height: iconSize },
                  active && styles.iconWrapActive,
                ]}
              >
                <CategoryImage
                  name={category.name}
                  imageUrl={category.imageUrl}
                  style={styles.image}
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {category.name}
              </Text>
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
  cardActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
  },
  iconWrap: {
    borderRadius: 10,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 4,
  },
  iconWrapActive: {
    backgroundColor: '#E8F5E3',
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
  labelActive: {
    color: colors.accent,
  },
});
