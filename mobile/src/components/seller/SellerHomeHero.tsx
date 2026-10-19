import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Logo } from '@/src/components/Logo';
import { colors, fonts, spacing } from '@/src/constants/theme';

type SellerHomeHeroProps = {
  name?: string | null;
  city?: string | null;
  activeListings: number;
  unreadCount: number;
  topInset: number;
  horizontalPadding: number;
};

const HERO_IMAGE = require('@/assets/images/seller/hero-midc.jpg');

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export function SellerHomeHero({
  name,
  city,
  activeListings,
  unreadCount,
  topInset,
  horizontalPadding,
}: SellerHomeHeroProps) {
  const displayName = name?.trim() || 'Seller';
  const listingsLabel = `${activeListings.toLocaleString('en-IN')} active listing${
    activeListings === 1 ? '' : 's'
  }`;

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
            onPress={() => router.push('/(seller)/notifications')}
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

        <View style={styles.greetingRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {displayName} 👋
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.locationPill, pressed && styles.pressed]}
            onPress={() => router.push('/(seller)/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Location"
          >
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={13} color={colors.white} />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationCity} numberOfLines={1}>
                {city?.trim() || 'Set location'}
              </Text>
              <Text style={styles.locationMeta} numberOfLines={1}>
                {listingsLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.taglineBlock}>
          <Text style={styles.taglineStrong}>Industrial surplus around you.</Text>
          <Text style={styles.tagline}>Buy. Sell. Reuse. Keep industry moving.</Text>
        </View>
      </View>
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
    paddingBottom: spacing.lg,
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.semibold,
    letterSpacing: -0.2,
  },
  name: {
    color: colors.textStrong,
    fontSize: 28,
    lineHeight: 36,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    maxWidth: 184,
    marginBottom: 4,
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
  },
  locationCity: {
    color: colors.textStrong,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  locationMeta: {
    color: colors.muted,
    fontSize: 10,
    fontFamily: fonts.medium,
  },
  taglineBlock: {
    marginTop: spacing.xs,
    gap: 2,
  },
  taglineStrong: {
    color: colors.textStrong,
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  tagline: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
