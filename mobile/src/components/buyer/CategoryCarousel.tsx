import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getCategoryIcon } from '@/src/lib/productFormat';
import { colors, spacing } from '@/src/constants/theme';
import type { ProductCategory } from '@/src/types/product';

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
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop by Category</Text>
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
              style={[styles.card, active && styles.cardActive]}
              onPress={() => onSelectCategory(active ? '' : category.name)}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={getCategoryIcon(category.name) as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={active ? colors.white : colors.accent}
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
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  card: {
    width: 92,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  cardActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelActive: {
    color: colors.accent,
  },
});
