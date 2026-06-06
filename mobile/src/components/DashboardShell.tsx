import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/src/components/Logo';
import { colors, spacing } from '@/src/constants/theme';
import type { UserRole } from '@/src/types/auth';

type DashboardShellProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  stats?: { label: string; value: string }[];
  children?: ReactNode;
};

export function DashboardShell({
  role,
  title,
  subtitle,
  stats = [],
  children,
}: DashboardShellProps) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Logo size="sm" />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.roleBadge}>{role.toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {stats.length > 0 ? (
        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {children}
    </ScrollView>
  );
}

export function DashboardScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {children}
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
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'flex-start',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
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
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
});
