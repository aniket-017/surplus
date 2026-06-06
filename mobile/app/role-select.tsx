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
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import type { UserRole } from '@/src/types/auth';

export default function RoleSelectScreen() {
  const { setRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');

  async function handleSelect(role: UserRole) {
    setLoadingRole(role);
    setError('');

    try {
      await setRole(role);
      router.replace(role === 'buyer' ? '/(buyer)/dashboard' : '/(seller)/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set role');
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo size="lg" />

        <View style={styles.header}>
          <Text style={styles.title}>How will you use Surplus?</Text>
          <Text style={styles.subtitle}>
            Choose your role to get started. You can switch anytime from your dashboard.
          </Text>
        </View>

        <Pressable
          style={styles.card}
          onPress={() => handleSelect('buyer')}
          disabled={!!loadingRole}
        >
          <Text style={styles.cardBadge}>Buyer</Text>
          <Text style={styles.cardTitle}>Become a Buyer</Text>
          <Text style={styles.cardText}>
            Browse surplus inventory, place orders, and recover value for your business.
          </Text>
          {loadingRole === 'buyer' ? <ActivityIndicator color={colors.accent} /> : null}
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => handleSelect('seller')}
          disabled={!!loadingRole}
        >
          <Text style={styles.cardBadge}>Seller</Text>
          <Text style={styles.cardTitle}>Become a Seller</Text>
          <Text style={styles.cardText}>
            List surplus stock, manage listings, and connect with industrial buyers.
          </Text>
          {loadingRole === 'seller' ? <ActivityIndicator color={colors.accent} /> : null}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
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
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardTitle: {
    color: colors.textStrong,
    fontSize: 22,
    fontWeight: '800',
  },
  cardText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 14,
  },
});
