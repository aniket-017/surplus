import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ServiceThumbnail } from '@/src/components/ServiceThumbnail';
import { colors, spacing } from '@/src/constants/theme';
import { formatServicePrice } from '@/src/lib/serviceCategories';
import { SERVICE_MODE_LABELS, type Service } from '@/src/types/service';

type SellerServiceCardProps = {
  service: Service;
  onPress: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
};

const PRICE_GREEN = '#1B5E20';
const PAUSED_AMBER = '#B45309';
const DELETED_GRAY = '#607D8B';

const STATUS_BADGES = {
  active: { label: 'Active', bg: colors.accent },
  paused: { label: 'Paused', bg: PAUSED_AMBER },
  deleted: { label: 'Deleted', bg: DELETED_GRAY },
} as const;

type MenuAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
};

export function SellerServiceCard({
  service,
  onPress,
  onEdit,
  onToggleStatus,
  onDelete,
}: SellerServiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const badge = STATUS_BADGES[service.listingStatus] ?? STATUS_BADGES.active;
  const isDeleted = service.listingStatus === 'deleted';
  const isPaused = service.listingStatus === 'paused';

  const actions: MenuAction[] = [
    { key: 'view', icon: 'eye-outline', label: 'View Details', color: colors.textStrong, onPress },
  ];
  if (!isDeleted) {
    actions.push(
      { key: 'edit', icon: 'create-outline', label: 'Edit Service', color: colors.accent, onPress: onEdit },
      {
        key: 'status',
        icon: isPaused ? 'play-circle-outline' : 'pause-circle-outline',
        label: isPaused ? 'Resume Service' : 'Pause Service',
        color: PAUSED_AMBER,
        onPress: onToggleStatus,
      },
      { key: 'delete', icon: 'trash-outline', label: 'Delete', color: colors.error, onPress: onDelete },
    );
  }

  return (
    <>
      <Pressable style={styles.card} onPress={onPress}>
        <View>
          <ServiceThumbnail
            image={service.images[0]}
            category={service.category}
            style={styles.image}
          />
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={styles.statusBadgeText}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {service.title}
            </Text>
            <Pressable
              style={styles.menuButton}
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation();
                setMenuOpen(true);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.category} numberOfLines={1}>
            {service.category}
          </Text>

          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {SERVICE_MODE_LABELS[service.serviceMode]} · {service.location.city}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.price}>{formatServicePrice(service)}</Text>
            <Text style={styles.views}>
              Views {service.viewCount ?? 0}
              {(service.inquiryCount ?? 0) > 0
                ? ` · ${service.inquiryCount} enquir${service.inquiryCount === 1 ? 'y' : 'ies'}`
                : ''}
            </Text>
          </View>
        </View>
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            <View style={styles.menuCard}>
              {actions.map((action, index) => (
                <View key={action.key}>
                  {index > 0 ? <View style={styles.menuDivider} /> : null}
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuOpen(false);
                      action.onPress();
                    }}
                  >
                    <Ionicons name={action.icon} size={18} color={action.color} />
                    <Text style={[styles.menuItemText, { color: action.color }]}>
                      {action.label}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  image: {
    width: 88,
    height: 100,
    borderRadius: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    color: colors.textStrong,
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 20,
  },
  menuButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  category: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  price: {
    flexShrink: 1,
    color: PRICE_GREEN,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  views: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menuCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
