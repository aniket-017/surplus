import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/src/context/AuthContext';
import { useBuyerLocation } from '@/src/context/LocationContext';
import { getSavedListings, toggleSavedListing } from '@/src/lib/conversationsApi';
import { browseServices, getServiceCategories } from '@/src/lib/servicesApi';
import type { ServiceCategory, ServiceListing, ServiceMode } from '@/src/types/service';

export type ServiceSortChip = 'nearby' | 'recent' | 'price';

type UseServicesFeedOptions = {
  /** When false the feed stays idle, e.g. while Home is showing products. */
  enabled?: boolean;
  initialCategory?: string;
};

export function useServicesFeed({ enabled = true, initialCategory = '' }: UseServicesFeedOptions = {}) {
  const { token, user } = useAuth();
  const { location } = useBuyerLocation();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sortChip, setSortChip] = useState<ServiceSortChip>('recent');
  const [serviceMode, setServiceMode] = useState<ServiceMode | ''>('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const nearMeCity = location?.city || user?.address?.city || '';

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const [categoriesData, servicesData, savedData] = await Promise.all([
          getServiceCategories(token),
          browseServices(token, {
            search: debouncedSearch || undefined,
            category: category || undefined,
            sort: sortChip === 'price' ? 'price_asc' : 'recent',
            city: sortChip === 'nearby' && nearMeCity ? nearMeCity : undefined,
            serviceMode: serviceMode || undefined,
            limit: 40,
          }),
          getSavedListings(token).catch(() => ({ products: [], services: [] })),
        ]);

        setCategories(categoriesData.categories);
        setServices(servicesData.services);
        setSavedIds(new Set((savedData.services ?? []).map((item) => item.id)));

        if (sortChip === 'nearby' && !nearMeCity) {
          setError('Tap the location at the top to choose where "Nearby" should look.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load services');
        setServices([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, debouncedSearch, category, sortChip, serviceMode, nearMeCity],
  );

  useFocusEffect(
    useCallback(() => {
      if (enabled) void load();
    }, [enabled, load]),
  );

  const toggleSave = useCallback(
    async (serviceId: string) => {
      if (!token) return;
      const wasSaved = savedIds.has(serviceId);
      const apply = (saved: boolean) =>
        setSavedIds((current) => {
          const next = new Set(current);
          if (saved) next.add(serviceId);
          else next.delete(serviceId);
          return next;
        });

      apply(!wasSaved);
      try {
        const result = await toggleSavedListing(token, serviceId);
        apply(result.saved);
      } catch (err) {
        apply(wasSaved);
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update saved service');
      }
    },
    [token, savedIds],
  );

  return {
    search,
    setSearch,
    category,
    setCategory,
    sortChip,
    setSortChip,
    serviceMode,
    setServiceMode,
    categories,
    services,
    savedIds,
    loading,
    refreshing,
    error,
    load,
    toggleSave,
  };
}

export type ServicesFeed = ReturnType<typeof useServicesFeed>;
