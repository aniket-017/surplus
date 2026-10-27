import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cardShadow, colors, fonts } from '@/src/constants/theme';
import { SERVICE_CATEGORIES } from '@/src/lib/serviceCategories';
import type { ServiceCategory } from '@/src/types/service';

/** Matches the product CategoryCarousel: ~2.9 cards visible with a peek of the next. */
const VISIBLE_CARDS = 2.9;
const CARD_GAP = 10;
const CARD_RADIUS = 18;
const SERVICE_ORANGE = '#EA580C';

type ServiceCategoryRailProps = {
  /** Server categories with counts; falls back to the static list while loading. */
  categories?: ServiceCategory[];
  selected?: string;
  onSelect: (category: string) => void;
  contentPadding?: number;
};

function formatCount(count: number) {
  if (count <= 0) return null;
  return `${count} provider${count === 1 ? '' : 's'}`;
}

export function ServiceCategoryRail({
  categories,
  selected,
  onSelect,
  contentPadding = 0,
}: ServiceCategoryRailProps) {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - contentPadding * 2;
  const cardWidth = (contentWidth - CARD_GAP * Math.floor(VISIBLE_CARDS)) / VISIBLE_CARDS;
  const countByName = new Map((categories ?? []).map((item) => [item.name, item.count ?? 0]));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: contentPadding }]}
    >
      {SERVICE_CATEGORIES.map((category) => {
        const active = selected === category.name;
        const countLabel = formatCount(countByName.get(category.name) ?? 0);

        return (
          <Pressable
            key={category.name}
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth, height: cardWidth },
              !category.image && { backgroundColor: category.tint },
              active && styles.cardSelected,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(active ? '' : category.name)}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            accessibilityState={{ selected: active }}
          >
            {category.image ? (
              <>
                <Image source={category.image} style={styles.image} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(15, 27, 45, 0.55)', 'rgba(15, 27, 45, 0.85)']}
                  locations={[0, 0.45, 1]}
                  style={styles.gradient}
                />
              </>
            ) : (
              <View style={styles.iconWrap}>
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={category.color}
                />
              </View>
            )}

            <View style={styles.labelBlock}>
              <Text
                style={[styles.label, !category.image && styles.labelDark]}
                numberOfLines={2}
              >
                {category.name}
              </Text>
              {countLabel ? (
                <Text
                  style={[styles.count, !category.image && styles.countDark]}
                  numberOfLines={1}
                >
                  {countLabel}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: CARD_GAP,
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
    borderColor: SERVICE_ORANGE,
  },
  pressed: {
    opacity: 0.88,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
  },
  iconWrap: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13,
    lineHeight: 16,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
  labelDark: {
    color: colors.textStrong,
  },
  count: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10.5,
    lineHeight: 13,
    fontFamily: fonts.medium,
  },
  countDark: {
    color: colors.muted,
  },
});
