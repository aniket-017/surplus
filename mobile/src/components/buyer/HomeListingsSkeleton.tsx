import { StyleSheet, View } from 'react-native';

import { SkeletonBone } from '@/src/components/SkeletonBone';
import { colors, spacing } from '@/src/constants/theme';

type ProductListingCardSkeletonProps = {
  width: number;
  delay?: number;
};

export function ProductListingCardSkeleton({ width, delay = 0 }: ProductListingCardSkeletonProps) {
  return (
    <View style={[styles.card, { width }]}>
      <SkeletonBone width="100%" height={120} radius={0} delay={delay} />
      <View style={styles.content}>
        <SkeletonBone width="92%" height={14} radius={6} delay={delay + 40} />
        <SkeletonBone width="68%" height={14} radius={6} delay={delay + 80} />
        <SkeletonBone width="42%" height={12} radius={6} delay={delay + 120} />
        <SkeletonBone width={88} height={15} radius={6} delay={delay + 160} style={styles.price} />
        <View style={styles.sellerRow}>
          <SkeletonBone width={22} height={22} radius={11} delay={delay + 200} />
          <SkeletonBone width={72} height={11} radius={6} delay={delay + 220} />
        </View>
      </View>
    </View>
  );
}

type HomeListingsSkeletonProps = {
  columns: number;
  cardWidth: number;
  count?: number;
};

export function HomeListingsSkeleton({ columns, cardWidth, count }: HomeListingsSkeletonProps) {
  const items = Array.from({ length: count ?? columns * 3 }, (_, i) => i);
  const rows: number[][] = [];

  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((index) => (
            <ProductListingCardSkeleton
              key={index}
              width={cardWidth}
              delay={index * 50}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  content: {
    padding: spacing.sm,
    gap: 6,
  },
  price: {
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
});
