import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { LocationPickerModal } from '@/src/components/buyer/LocationPickerModal';
import { useAdminNotificationUnreadCount } from '@/src/context/AdminNotificationsContext';
import { useAuth } from '@/src/context/AuthContext';
import { useBuyerLocation } from '@/src/context/LocationContext';
import { colors, spacing } from '@/src/constants/theme';
import { formatBuyerLocation } from '@/src/types/location';

export function BuyerHomeHeader() {
  const { user } = useAuth();
  const { location } = useBuyerLocation();
  const unreadCount = useAdminNotificationUnreadCount();
  const [pickerVisible, setPickerVisible] = useState(false);

  const profileLabel = user?.address?.city
    ? `${user.address.city}, ${user.address.state}`
    : '';
  const locationLabel = location
    ? formatBuyerLocation(location)
    : profileLabel || 'Choose location';

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.locationBlock, pressed && styles.locationBlockPressed]}
        onPress={() => setPickerVisible(true)}
        hitSlop={4}
      >
        <Ionicons name="location-outline" size={18} color={colors.accent} />
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationLabel}>Location</Text>
          <Text style={styles.locationValue} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          hitSlop={8}
          onPress={() => router.push('/(buyer)/notifications')}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textStrong} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <LocationPickerModal visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  locationBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationBlockPressed: {
    opacity: 0.7,
  },
  locationTextWrap: {
    flex: 1,
    gap: 1,
  },
  locationLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  locationValue: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
