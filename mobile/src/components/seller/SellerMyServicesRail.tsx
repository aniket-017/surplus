import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ServiceThumbnail } from '@/src/components/ServiceThumbnail';
import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';
import { formatServicePrice } from '@/src/lib/serviceCategories';
import type { Service, ServiceStatus } from '@/src/types/service';

type SellerMyServicesRailProps = {
  services: Service[];
  loading?: boolean;
  onSeeAll: () => void;
  onOpenService: (serviceId: string) => void;
  onAddService: () => void;
};

const MAX_ITEMS = 10;
const CARD_WIDTH = 140;
const PRICE_GREEN = '#1B7A34';

const STATUS_STYLES: Record<ServiceStatus, { label: string; bg: string }> = {
  active: { label: 'Active', bg: colors.accent },
  paused: { label: 'Paused', bg: '#B45309' },
  deleted: { label: 'Deleted', bg: '#607D8B' },
};

function ServiceTile({ service, onPress }: { service: Service; onPress: () => void }) {
  const status = STATUS_STYLES[service.listingStatus] ?? STATUS_STYLES.active;

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={service.title}
    >
      <View>
        <ServiceThumbnail
          image={service.images[0]}
          category={service.category}
          style={styles.tileImage}
        />
        <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.tileBody}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {service.title}
        </Text>
        <Text style={styles.tileCategory} numberOfLines={1}>
          {service.category}
        </Text>
        <Text style={styles.tilePrice} numberOfLines={1}>
          {formatServicePrice(service)}
        </Text>
      </View>
    </Pressable>
  );
}

export function SellerMyServicesRail({
  services,
  loading = false,
  onSeeAll,
  onOpenService,
  onAddService,
}: SellerMyServicesRailProps) {
  const visible = services
    .filter((service) => service.listingStatus !== 'deleted')
    .slice(0, MAX_ITEMS);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>My Services</Text>
        {visible.length > 0 ? (
          <Pressable style={styles.link} onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.linkText}>See All</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.navy} />
          </Pressable>
        ) : null}
      </View>

      {loading && visible.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Do you take job work? List services like CNC machining, welding or fabrication.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyButton, pressed && styles.tilePressed]}
            onPress={onAddService}
          >
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.emptyButtonText}>Add your first service</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {visible.map((service) => (
            <ServiceTile
              key={service.id}
              service={service}
              onPress={() => onOpenService(service.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  title: {
    color: colors.textStrong,
    fontSize: 16,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    color: colors.navy,
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  rail: {
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  tile: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tilePressed: {
    opacity: 0.85,
  },
  tileImage: {
    width: '100%',
    height: 96,
  },
  statusChip: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  tileBody: {
    padding: 8,
    gap: 3,
  },
  tileTitle: {
    color: colors.textStrong,
    fontSize: 12.5,
    fontFamily: fonts.bold,
  },
  tileCategory: {
    color: colors.muted,
    fontSize: 10.5,
    fontFamily: fonts.medium,
  },
  tilePrice: {
    color: PRICE_GREEN,
    fontSize: 13,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.2,
  },
  loading: {
    paddingVertical: spacing.lg,
  },
  empty: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.medium,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
});
