import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';

export function BuyerHomeHeader() {
  const { user } = useAuth();
  const locationLabel = user?.address?.city
    ? `${user.address.city}, ${user.address.state}`
    : 'Set location in Profile';

  return (
    <View style={styles.container}>
      <View style={styles.locationBlock}>
        <Ionicons name="location-outline" size={18} color={colors.accent} />
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationLabel}>Location</Text>
          <Text style={styles.locationValue} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconButton} hitSlop={8}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textStrong} />
        </Pressable>
        <Pressable style={styles.iconButton} hitSlop={8}>
          <Ionicons name="notifications-outline" size={20} color={colors.textStrong} />
        </Pressable>
      </View>
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
});
