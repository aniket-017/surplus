import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAdminNotificationUnreadCount } from '@/src/context/AdminNotificationsContext';
import { colors, spacing } from '@/src/constants/theme';

type SellerListingsHeaderProps = {
  totalCount: number;
  onSearchPress: () => void;
};

export function SellerListingsHeader({
  totalCount,
  onSearchPress,
}: SellerListingsHeaderProps) {
  const unreadCount = useAdminNotificationUnreadCount();

  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>My Listings</Text>
        <Text style={styles.subtitle}>
          {totalCount} total listing{totalCount === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push('/(seller)/notifications')}
          hitSlop={8}
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
        <Pressable style={styles.iconButton} onPress={onSearchPress} hitSlop={8}>
          <Ionicons name="search-outline" size={20} color={colors.textStrong} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textStrong,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
