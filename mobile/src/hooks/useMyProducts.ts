import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/src/context/AuthContext';
import { getMyProducts } from '@/src/lib/productsApi';
import type { Product } from '@/src/types/product';

export function useMyProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getMyProducts(token);
      setProducts(data.products);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  return { products, loading, reload: loadProducts };
}
