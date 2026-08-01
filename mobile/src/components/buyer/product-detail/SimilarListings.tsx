import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { spacing } from '@/src/constants/theme';
import { ProductListingCard } from '@/src/components/buyer/ProductListingCard';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import type { ProductListing } from '@/src/types/product';

import { SectionCard } from './SectionCard';

type SimilarListingsProps = {
  products: ProductListing[];
  category: string;
};

export function SimilarListings({ products, category }: SimilarListingsProps) {
  const { width } = useBreakpoint();
  const cardWidth = Math.min(180, width * 0.44);

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
            width={cardWidth}
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
