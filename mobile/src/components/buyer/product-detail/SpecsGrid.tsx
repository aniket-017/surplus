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
        <View style={styles.list}>
          {attributes.map((attribute, index) => (
            <View
              key={`${attribute.key}-${index}`}
              style={[styles.row, index < attributes.length - 1 && styles.rowBorder]}
            >
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
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  key: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingTop: 2,
  },
  value: {
    flex: 1.2,
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'right',
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
