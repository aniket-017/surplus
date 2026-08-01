import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import type { ProductCondition, ProductListing } from '@/src/types/product';

import { SectionCard } from './SectionCard';

type WhyBuySectionProps = {
  product: ProductListing;
};

function getWhyBuyItems(product: ProductListing) {
  const items: string[] = ['Ready for pickup'];

  if (product.condition === 'surplus') {
    items.push('Suitable for reprocessing');
  } else if (product.condition === 'new') {
    items.push('Unused / new material');
  } else {
    items.push('Industrial grade material');
  }

  if (product.quantity >= 100) {
    items.push('Bulk quantity available');
  } else {
    items.push('Quantity available for immediate purchase');
  }

  const formAttr = product.attributes.find((a) =>
    /form|type|material/i.test(a.key),
  );
  if (formAttr) {
    items.push(`Ideal for ${formAttr.value.toLowerCase()} applications`);
  } else {
    items.push('Suitable for fabrication and industrial use');
  }

  return items.slice(0, 4);
}

export function WhyBuySection({ product }: WhyBuySectionProps) {
  const items = getWhyBuyItems(product);

  return (
    <SectionCard title="Why Buy?" subtitle="Key benefits">
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={`why-${index}`} style={styles.item}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  text: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 15,
    lineHeight: 22,
  },
});
