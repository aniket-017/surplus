import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { LocationPickerModal } from '@/src/components/buyer/LocationPickerModal';
import { useAuth } from '@/src/context/AuthContext';
import { useBuyerLocation } from '@/src/context/LocationContext';
import { useUnreadMessages } from '@/src/context/UnreadMessagesContext';
import { colors, spacing } from '@/src/constants/theme';
import { formatBuyerLocation } from '@/src/types/location';

export function BuyerHomeHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useBuyerLocation();
  const { unreadCount } = useUnreadMessages();
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
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={() => router.push('/(buyer)/(tabs)/messages')}
          hitSlop={8}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textStrong} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable style={styles.iconButton} hitSlop={8}>
          <Ionicons name="notifications-outline" size={20} color={colors.textStrong} />
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
  iconButtonPressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
