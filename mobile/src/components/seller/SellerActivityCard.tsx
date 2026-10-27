import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';
import { formatCompactPrice } from '@/src/lib/productFormat';

type SellerActivityCardProps = {
  activeListings: number;
  views: number;
  inquiries: number;
  estimatedValue: number;
  onViewStats: () => void;
};

type ActivityStat = {
  key: string;
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  glyph?: string;
  color: string;
  bg: string;
};

export function SellerActivityCard({
  activeListings,
  views,
  inquiries,
  estimatedValue,
  onViewStats,
}: SellerActivityCardProps) {
  const stats: ActivityStat[] = [
    {
      key: 'listings',
      label: 'Active Listings',
      value: activeListings.toLocaleString('en-IN'),
      icon: 'layers-outline',
      color: colors.accent,
      bg: 'rgba(92, 179, 53, 0.14)',
    },
    {
      key: 'views',
      label: 'Views',
      value: views.toLocaleString('en-IN'),
      icon: 'eye-outline',
      color: '#2563EB',
      bg: 'rgba(59, 130, 246, 0.14)',
    },
    {
      key: 'inquiries',
      label: 'Inquiries',
      value: inquiries.toLocaleString('en-IN'),
      icon: 'chatbubble-ellipses-outline',
      color: '#EA580C',
      bg: 'rgba(249, 115, 22, 0.14)',
    },
    {
      key: 'value',
      label: 'Est. Value',
      value: formatCompactPrice(estimatedValue, { withSymbol: false }),
      glyph: '₹',
      color: '#7C3AED',
      bg: 'rgba(124, 58, 237, 0.12)',
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Activity</Text>
        <Pressable style={styles.link} onPress={onViewStats} hitSlop={8}>
          <Text style={styles.linkText}>View Detailed Stats</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.navy} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {stats.map((stat, index) => (
          <Fragment key={stat.key}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.stat}>
              <View style={[styles.iconWrap, { backgroundColor: stat.bg }]}>
                {stat.icon ? (
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                ) : (
                  <Text style={[styles.glyph, { color: stat.color }]}>{stat.glyph}</Text>
                )}
              </View>
              <View style={styles.statText}>
                <Text
                  style={styles.value}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {stat.value}
                </Text>
                <Text style={styles.label} numberOfLines={2}>
                  {stat.label}
                </Text>
              </View>
            </View>
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 14,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: 4,
    marginVertical: 6,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  glyph: {
    fontSize: 17,
    fontFamily: fonts.extrabold,
  },
  statText: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  value: {
    color: colors.textStrong,
    fontSize: 18,
    lineHeight: 23,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: 12.5,
    lineHeight: 16,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    marginTop: 2,
  },
});
