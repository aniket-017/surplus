import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import type { UserRole } from '@/src/types/auth';

type DashboardShellProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  footer?: ReactNode;
};

export function DashboardShell({ role, title, subtitle, stats, footer }: DashboardShellProps) {
  const { user, signOut, setRole } = useAuth();
  const [switching, setSwitching] = useState(false);

  async function handleSwitchRole() {
    const nextRole = role === 'buyer' ? 'seller' : 'buyer';
    setSwitching(true);

    try {
      await setRole(nextRole);
      router.replace(nextRole === 'buyer' ? '/(buyer)/dashboard' : '/(seller)/dashboard');
    } finally {
      setSwitching(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/sign-in');
  }

  const displayName = user?.name || user?.email || 'User';
  const switchLabel = role === 'buyer' ? 'Switch to Seller' : 'Switch to Buyer';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Logo size="sm" />
          <View style={styles.userBlock}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.roleBadge}>{role.toUpperCase()}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {footer}

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.buttonOutline]}
            onPress={handleSwitchRole}
            disabled={switching}
          >
            {switching ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.buttonOutlineText}>{switchLabel}</Text>
            )}
          </Pressable>

          <Pressable style={[styles.button, styles.buttonGhost]} onPress={handleSignOut}>
            <Text style={styles.buttonGhostText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.md,
  },
  userBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 16,
  },
  userName: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 16,
  },
  userEmail: {
    color: colors.muted,
    fontSize: 13,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  roleBadge: {
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
  title: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  actions: {
    gap: spacing.sm,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonOutline: {
    backgroundColor: colors.accent,
  },
  buttonOutlineText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonGhost: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonGhostText: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
