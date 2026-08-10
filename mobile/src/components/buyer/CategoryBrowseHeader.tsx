import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryImage } from '@/src/components/CategoryImage';
import { colors, spacing } from '@/src/constants/theme';

type CategoryBrowseHeaderProps = {
  categoryName: string;
  imageUrl?: string | null;
  listingCount: number;
  subcategoryCount: number;
  onBack: () => void;
};

export function CategoryBrowseHeader({
  categoryName,
  imageUrl,
  listingCount,
  subcategoryCount,
  onBack,
}: CategoryBrowseHeaderProps) {
  const listingLabel = listingCount === 1 ? 'listing' : 'listings';
  const subLabel = subcategoryCount === 1 ? 'subcategory' : 'subcategories';

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backButton} accessibilityRole="button">
          <Ionicons name="arrow-back" size={20} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {categoryName}
        </Text>
        <View style={styles.backButtonSpacer} />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroArt}>
          <CategoryImage name={categoryName} imageUrl={imageUrl} style={styles.heroImage} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{categoryName}</Text>
          <Text style={styles.heroMeta}>
            {listingCount} {listingLabel}
            {subcategoryCount > 0 ? ` · ${subcategoryCount} ${subLabel}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 36,
  },
  topTitle: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  heroArt: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: colors.textStrong,
    fontSize: 22,
    fontWeight: '800',
  },
  heroMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
