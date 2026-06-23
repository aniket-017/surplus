import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';

type SellerWelcomeBannerProps = {
  name?: string | null;
};

function getDisplayName(name?: string | null) {
  if (name?.trim()) {
    return name.trim();
  }
  return 'there';
}

export function SellerWelcomeBanner({ name }: SellerWelcomeBannerProps) {
  const displayName = getDisplayName(name);

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{displayName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    overflow: 'hidden',
  },
  accentBar: {
    width: 5,
    backgroundColor: colors.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 22,
    gap: 6,
  },
  greeting: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  name: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
});
