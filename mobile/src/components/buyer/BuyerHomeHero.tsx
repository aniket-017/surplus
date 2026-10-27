import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LocationPickerModal } from '@/src/components/buyer/LocationPickerModal';
import { Logo } from '@/src/components/Logo';
import { useAdminNotificationUnreadCount } from '@/src/context/AdminNotificationsContext';
import { useAuth } from '@/src/context/AuthContext';
import { useBuyerLocation } from '@/src/context/LocationContext';
import { colors, fonts, spacing } from '@/src/constants/theme';
import { formatBuyerLocation } from '@/src/types/location';

type BuyerHomeHeroProps = {
  topInset: number;
  horizontalPadding: number;
  mode?: 'products' | 'services';
};

const HERO_IMAGE = require('@/assets/images/buyer/hero-shop.jpg');
const SERVICE_ORANGE = '#EA580C';

const HERO_COPY = {
  products: {
    headline: 'Industrial Surplus,',
    subcopy: 'Verified sellers across Pune MIDC.',
    accent: colors.accent,
  },
  services: {
    headline: 'Skilled Workshops,',
    subcopy: 'CNC, welding and fabrication workshops near you.',
    accent: SERVICE_ORANGE,
  },
} as const;

export function BuyerHomeHero({ topInset, horizontalPadding, mode = 'products' }: BuyerHomeHeroProps) {
  const copy = HERO_COPY[mode];
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
    <View style={[styles.container, { paddingTop: topInset + 4 }]}>
      <Image source={HERO_IMAGE} style={styles.photo} contentFit="cover" contentPosition="right" />
      <LinearGradient
        colors={[
          colors.bgSubtle,
          'rgba(244, 247, 250, 0.94)',
          'rgba(244, 247, 250, 0.45)',
          'rgba(244, 247, 250, 0)',
        ]}
        locations={[0, 0.34, 0.56, 0.78]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(244, 247, 250, 0)', colors.bgSubtle]}
        locations={[0.68, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.topRow}>
          <Logo size="md" />
          <Pressable
            style={styles.bellButton}
            onPress={() => router.push('/(buyer)/notifications')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={21} color={colors.textStrong} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.headlineRow}>
          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>
              {copy.headline}
              {'\n'}
              <Text style={[styles.headlineAccent, { color: copy.accent }]}>Right Next Door</Text>
            </Text>
            <Text style={styles.subcopy}>{copy.subcopy}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.locationPill, pressed && styles.pressed]}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose location"
          >
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={13} color={colors.white} />
            </View>
            <Text style={styles.locationText} numberOfLines={2}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <LocationPickerModal visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.bgSubtle,
  },
  photo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '74%',
  },
  content: {
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fonts.extrabold,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  headlineBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  headline: {
    color: colors.textStrong,
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.7,
  },
  headlineAccent: {
    color: colors.accent,
    fontFamily: fonts.extrabold,
  },
  subcopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
    maxWidth: 220,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 150,
    marginBottom: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  pressed: {
    opacity: 0.8,
  },
  locationIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flexShrink: 1,
    color: colors.textStrong,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.bold,
  },
});
