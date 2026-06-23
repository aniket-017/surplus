import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/src/context/AuthContext';
import { getMyProducts, type SellerDashboardStats } from '@/src/lib/productsApi';
import type { Product } from '@/src/types/product';

const EMPTY_STATS: SellerDashboardStats = {
  activeListings: 0,
  totalViews: 0,
  totalInquiries: 0,
};

export function useMyProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SellerDashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }

    try {
      const data = await getMyProducts(token);
      setProducts(data.products);
      setStats(data.stats ?? EMPTY_STATS);
    } catch {
      setProducts([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  return { products, stats, loading, reload: loadProducts };
}
