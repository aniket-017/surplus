import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { formatAttributeKey, type ProductAttribute } from '@/src/types/product';

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
    gap: 4,
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  key: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
