import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/src/components/Logo';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { cardShadow, colors, radius, spacing } from '@/src/constants/theme';
import type { UserRole } from '@/src/types/auth';

export default function RoleSelectScreen() {
  const { setRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');

  async function handleSelect(role: UserRole) {
    if (loadingRole) return;

    setLoadingRole(role);
    setError('');

    try {
      await setRole(role);
      router.replace(role === 'buyer' ? '/(buyer)/(tabs)' : '/(seller)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set role');
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenContent style={styles.container}>
        <View style={styles.brand}>
          <Logo size="lg" />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>How will you use Surplus?</Text>
          <Text style={styles.subtitle}>
            Choose your role to get started. You can switch anytime from your profile.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
            loadingRole === 'buyer' && styles.cardActive,
          ]}
          onPress={() => handleSelect('buyer')}
          disabled={!!loadingRole}
        >
          <Text style={styles.cardBadge}>Buyer</Text>
          <Text style={styles.cardTitle}>Become a Buyer</Text>
          <Text style={styles.cardText}>
            Browse surplus inventory, place orders, and recover value for your business.
          </Text>
          {loadingRole === 'buyer' ? (
            <ActivityIndicator color={colors.accent} style={styles.cardLoader} />
          ) : null}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
            loadingRole === 'seller' && styles.cardActive,
          ]}
          onPress={() => handleSelect('seller')}
          disabled={!!loadingRole}
        >
          <Text style={styles.cardBadge}>Seller</Text>
          <Text style={styles.cardTitle}>Become a Seller</Text>
          <Text style={styles.cardText}>
            List surplus stock, manage listings, and connect with industrial buyers.
          </Text>
          {loadingRole === 'seller' ? (
            <ActivityIndicator color={colors.accent} style={styles.cardLoader} />
          ) : null}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScreenContent>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textStrong,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    gap: spacing.sm,
    ...cardShadow,
  },
  cardPressed: {
    borderColor: colors.borderAccent,
    backgroundColor: colors.surfaceMuted,
    opacity: 0.96,
  },
  cardActive: {
    borderColor: colors.borderAccent,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    color: colors.accentHover,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  cardTitle: {
    color: colors.textStrong,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  cardLoader: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
