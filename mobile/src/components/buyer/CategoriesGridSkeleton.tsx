import { StyleSheet, View } from 'react-native';

import {
  CATEGORY_CARD_RADIUS,
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_PADDING,
} from '@/src/components/buyer/BuyerCategoryCard';
import { SkeletonBone } from '@/src/components/SkeletonBone';
import { spacing } from '@/src/constants/theme';

type CategoriesGridSkeletonProps = {
  columns: number;
  tileWidth: number;
  count?: number;
};

export function CategoriesGridSkeleton({
  columns,
  tileWidth,
  count,
}: CategoriesGridSkeletonProps) {
  const items = Array.from({ length: count ?? columns * 5 }, (_, i) => i);
  const rows: number[][] = [];

  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((index) => (
            <SkeletonBone
              key={index}
              width={tileWidth}
              height={tileWidth}
              radius={CATEGORY_CARD_RADIUS}
              delay={index * 40}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: CATEGORY_GRID_PADDING,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: CATEGORY_GRID_GAP,
    marginBottom: CATEGORY_GRID_GAP,
  },
});
