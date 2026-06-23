import { router } from 'expo-router';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { ProductListingCard } from '@/src/components/buyer/ProductListingCard';
import type { ProductListing } from '@/src/types/product';

import { SectionCard } from './SectionCard';

const CARD_WIDTH = Math.min(180, Dimensions.get('window').width * 0.44);

type SimilarListingsProps = {
  products: ProductListing[];
  category: string;
};

export function SimilarListings({ products, category }: SimilarListingsProps) {
  if (products.length === 0) return null;

  return (
    <SectionCard title={`Similar ${category}`} subtitle="More listings you may like">
      <FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductListingCard
            product={item}
            width={CARD_WIDTH}
            onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })}
          />
        )}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
});
