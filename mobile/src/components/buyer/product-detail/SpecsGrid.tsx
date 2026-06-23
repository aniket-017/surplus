import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { formatAttributeKey } from '@/src/lib/productFormat';
import type { ProductAttribute } from '@/src/types/product';

import { SectionCard } from './SectionCard';

type SpecsGridProps = {
  attributes: ProductAttribute[];
};

export function SpecsGrid({ attributes }: SpecsGridProps) {
  return (
    <SectionCard
      title="Specifications"
      subtitle={
        attributes.length
          ? `${attributes.length} material-specific properties`
          : 'No specifications listed'
      }
    >
      {attributes.length === 0 ? (
        <Text style={styles.empty}>No attributes were added for this listing.</Text>
      ) : (
        <View style={styles.grid}>
          {attributes.map((attribute, index) => (
            <View key={`${attribute.key}-${index}`} style={styles.cell}>
              <Text style={styles.key}>{formatAttributeKey(attribute.key)}</Text>
              <Text style={styles.value}>{attribute.value}</Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cell: {
    width: '48%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: spacing.sm,
    gap: 4,
  },
  key: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
