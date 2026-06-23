import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';
import { formatPrice } from '@/src/lib/productFormat';

type StatTone = 'green' | 'blue' | 'amber' | 'navy';

type SellerDashboardStatsProps = {
  activeListings: number;
  views?: number;
  inquiries?: number;
  estimatedValue: number;
};

const TONE_STYLES: Record<StatTone, { bg: string; border: string; icon: string; iconBg: string }> =
  {
    green: {
      bg: 'rgba(92, 179, 53, 0.1)',
      border: 'rgba(92, 179, 53, 0.22)',
      icon: colors.accent,
      iconBg: 'rgba(92, 179, 53, 0.14)',
    },
    blue: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.2)',
      icon: '#2563EB',
      iconBg: 'rgba(59, 130, 246, 0.14)',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.22)',
      icon: '#D97706',
      iconBg: 'rgba(245, 158, 11, 0.16)',
    },
    navy: {
      bg: 'rgba(15, 27, 45, 0.06)',
      border: 'rgba(15, 27, 45, 0.12)',
      icon: colors.navy,
      iconBg: 'rgba(15, 27, 45, 0.08)',
    },
  };

function StatCard({
  label,
  value,
  icon,
  tone,
  compactValue = false,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: StatTone;
  compactValue?: boolean;
}) {
  const toneStyle = TONE_STYLES[tone];

  return (
    <View style={[styles.card, { backgroundColor: toneStyle.bg, borderColor: toneStyle.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: toneStyle.iconBg }]}>
        <Ionicons name={icon} size={20} color={toneStyle.icon} />
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.value, compactValue && styles.valueCompact]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {value}
        </Text>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export function SellerDashboardStats({
  activeListings,
  views = 0,
  inquiries = 0,
  estimatedValue,
}: SellerDashboardStatsProps) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCard
          label="Active Listings"
          value={String(activeListings)}
          icon="layers-outline"
          tone="green"
        />
        <StatCard label="Views" value={String(views)} icon="eye-outline" tone="blue" />
      </View>
      <View style={styles.row}>
        <StatCard
          label="Inquiries"
          value={String(inquiries)}
          icon="chatbubble-ellipses-outline"
          tone="amber"
        />
        <StatCard
          label="Est. Value"
          value={formatPrice(estimatedValue)}
          icon="wallet-outline"
          tone="navy"
          compactValue
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    minHeight: 84,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    justifyContent: 'center',
  },
  value: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  valueCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
});
