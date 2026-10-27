import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '@/src/components/DashboardShell';
import { ScreenContent } from '@/src/components/ScreenContent';
import {
  SellerAddProductCard,
  SellerListingCard,
  SellerListingsHeader,
  SellerListingStatusTabs,
  SellerServiceCard,
  filterSellerListings,
  getSellerListingCounts,
  type SellerListingFilter,
} from '@/src/components/seller';
import { useAuth } from '@/src/context/AuthContext';
import { useMyProducts } from '@/src/hooks/useMyProducts';
import { useMyServices } from '@/src/hooks/useMyServices';
import { colors, spacing } from '@/src/constants/theme';
import { deleteProduct, markProductSold } from '@/src/lib/productsApi';
import { deleteService, setServiceStatus } from '@/src/lib/servicesApi';
import type { Service } from '@/src/types/service';

type ListingKind = 'products' | 'services';
type ServiceFilter = 'all' | 'active' | 'paused';

const SERVICE_FILTERS: { id: ServiceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
];

function filterServices(services: Service[], filter: ServiceFilter, query: string) {
  const q = query.trim().toLowerCase();
  return services.filter((service) => {
    if (filter !== 'all' && service.listingStatus !== filter) return false;
    if (filter === 'all' && service.listingStatus === 'deleted') return false;
    if (!q) return true;
    return (
      service.title.toLowerCase().includes(q) ||
      service.category.toLowerCase().includes(q) ||
      service.capabilities.some((cap) => cap.toLowerCase().includes(q))
    );
  });
}

export default function SellerListingsTab() {
  const { token } = useAuth();
  const { products, loading, reload } = useMyProducts();
  const { services, loading: servicesLoading, reload: reloadServices } = useMyServices();
  const [kind, setKind] = useState<ListingKind>('products');
  const [activeFilter, setActiveFilter] = useState<SellerListingFilter>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { q, tab } = useLocalSearchParams<{ q?: string; tab?: string }>();

  useEffect(() => {
    if (!q) return;
    setSearchQuery(q);
    setSearchOpen(true);
  }, [q]);

  useEffect(() => {
    if (tab === 'services' || tab === 'products') {
      setKind(tab);
    }
  }, [tab]);

  const counts = useMemo(() => getSellerListingCounts(products), [products]);
  const filteredProducts = useMemo(
    () => filterSellerListings(products, activeFilter, searchQuery),
    [products, activeFilter, searchQuery],
  );
  const visibleServices = useMemo(
    () => services.filter((service) => service.listingStatus !== 'deleted'),
    [services],
  );
  const filteredServices = useMemo(
    () => filterServices(services, serviceFilter, searchQuery),
    [services, serviceFilter, searchQuery],
  );

  function openProduct(productId: string) {
    router.push({
      pathname: '/(seller)/products/[id]',
      params: { id: productId },
    });
  }

  function openEdit(productId: string) {
    router.push({
      pathname: '/(seller)/edit-product/[id]',
      params: { id: productId },
    });
  }

  function openService(serviceId: string) {
    router.push({ pathname: '/(seller)/services/[id]', params: { id: serviceId } });
  }

  function openEditService(serviceId: string) {
    router.push({ pathname: '/(seller)/edit-service/[id]', params: { id: serviceId } });
  }

  function confirmMarkSold(productId: string, title: string) {
    Alert.alert('Mark as Sold', `Mark "${title}" as sold? It will no longer appear to buyers.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Sold',
        onPress: () => void handleMarkSold(productId),
      },
    ]);
  }

  function confirmDelete(productId: string, title: string) {
    Alert.alert(
      'Delete Listing',
      `Delete "${title}"? It will be hidden from buyers and shown as deleted in your listings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void handleDelete(productId),
        },
      ],
    );
  }

  function confirmDeleteService(service: Service) {
    Alert.alert('Delete Service', `Delete "${service.title}"? Buyers will no longer see it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void runServiceAction(service.id, () => deleteService(token!, service.id)),
      },
    ]);
  }

  function toggleServiceStatus(service: Service) {
    const next = service.listingStatus === 'paused' ? 'active' : 'paused';
    void runServiceAction(service.id, () => setServiceStatus(token!, service.id, next));
  }

  async function runServiceAction(serviceId: string, action: () => Promise<unknown>) {
    if (!token || actionLoadingId) return;

    setActionLoadingId(serviceId);
    try {
      await action();
      await reloadServices();
    } catch (error) {
      Alert.alert('Could not update service', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleMarkSold(productId: string) {
    if (!token || actionLoadingId) return;

    setActionLoadingId(productId);
    try {
      await markProductSold(token, productId);
      await reload();
    } catch (error) {
      Alert.alert('Could not mark as sold', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(productId: string) {
    if (!token || actionLoadingId) return;

    setActionLoadingId(productId);
    try {
      await deleteProduct(token, productId);
      await reload();
    } catch (error) {
      Alert.alert('Could not delete listing', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setActionLoadingId(null);
    }
  }

  const isServices = kind === 'services';

  return (
    <DashboardScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenContent style={styles.screenContent}>
        <SellerListingsHeader
          totalCount={isServices ? visibleServices.length : products.length}
          onSearchPress={() => setSearchOpen((value) => !value)}
        />

        <View style={styles.segment}>
          {(['products', 'services'] as const).map((option) => {
            const active = kind === option;
            return (
              <Pressable
                key={option}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => setKind(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={option === 'products' ? 'cube-outline' : 'hammer-outline'}
                  size={16}
                  color={active ? colors.textStrong : colors.muted}
                />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {option === 'products' ? 'Products' : 'Services'}
                </Text>
                <Text style={[styles.segmentCount, active && styles.segmentCountActive]}>
                  {option === 'products' ? products.length : visibleServices.length}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {searchOpen ? (
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={isServices ? 'Search services...' : 'Search listings...'}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoFocus
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {isServices ? (
          <>
            <SellerAddProductCard
              onPress={() => router.push('/(seller)/add-service')}
              title="Add New Service"
              subtitle="Offer job work like CNC, welding or fabrication"
            />

            <View style={styles.filterRow}>
              {SERVICE_FILTERS.map((filter) => {
                const active = serviceFilter === filter.id;
                return (
                  <Pressable
                    key={filter.id}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setServiceFilter(filter.id)}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {servicesLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : filteredServices.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {visibleServices.length === 0 ? 'No services yet' : 'No matching services'}
                </Text>
                <Text style={styles.emptyText}>
                  {visibleServices.length === 0
                    ? 'List the job work you take on so nearby industries can send you enquiries.'
                    : 'Try a different filter or search term.'}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredServices.map((service) => (
                  <SellerServiceCard
                    key={service.id}
                    service={service}
                    onPress={() => openService(service.id)}
                    onEdit={() => openEditService(service.id)}
                    onToggleStatus={() => toggleServiceStatus(service)}
                    onDelete={() => confirmDeleteService(service)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <SellerAddProductCard onPress={() => router.push('/(seller)/add-product')} />

            <SellerListingStatusTabs
              activeFilter={activeFilter}
              counts={counts}
              onChange={setActiveFilter}
            />

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : filteredProducts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {products.length === 0 ? 'No listings yet' : 'No matching listings'}
                </Text>
                <Text style={styles.emptyText}>
                  {products.length === 0
                    ? 'Add your first surplus item to start reaching buyers on Surplus.'
                    : 'Try a different filter or search term to find your listings.'}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredProducts.map((product) => (
                  <SellerListingCard
                    key={product.id}
                    product={product}
                    onPress={() => openProduct(product.id)}
                    onEdit={() => openEdit(product.id)}
                    onMarkSold={() => confirmMarkSold(product.id, product.title)}
                    onDelete={() => confirmDelete(product.id, product.title)}
                  />
                ))}
              </View>
            )}
          </>
        )}
        </ScreenContent>
      </ScrollView>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  screenContent: {
    gap: spacing.md,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentItemActive: {
    backgroundColor: colors.surface,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.textStrong,
    fontWeight: '800',
  },
  segmentCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentCountActive: {
    color: colors.accent,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 15,
    paddingVertical: 0,
  },
  loadingWrap: {
    paddingVertical: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
