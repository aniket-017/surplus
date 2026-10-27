import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';

export const AI_COLOR = '#7C3AED';
export const AI_TINT = 'rgba(124, 58, 237, 0.08)';

export function SectionHeader({
  title,
  subtitle,
  showDivider = true,
}: {
  title: string;
  subtitle?: string;
  showDivider?: boolean;
}) {
  return (
    <View style={[formStyles.sectionHeader, !showDivider && formStyles.sectionHeaderFirst]}>
      <Text style={formStyles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={formStyles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  hint,
  aiSuggested = false,
  action,
  children,
}: {
  label: string;
  hint?: string;
  aiSuggested?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={formStyles.field}>
      <View style={formStyles.labelRow}>
        <Text style={formStyles.label}>{label}</Text>
        {aiSuggested ? <AiBadge /> : null}
        <View style={formStyles.flex} />
        {action}
      </View>
      {children}
      {hint ? <Text style={formStyles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function AiBadge({ label = 'AI suggested' }: { label?: string }) {
  return (
    <View style={formStyles.aiBadge}>
      <Ionicons name="sparkles" size={10} color={AI_COLOR} />
      <Text style={formStyles.aiBadgeText}>{label}</Text>
    </View>
  );
}

export function AiActionButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={formStyles.aiAction}
      onPress={onPress}
      disabled={loading}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={AI_COLOR} />
      ) : (
        <Ionicons name="sparkles" size={13} color={AI_COLOR} />
      )}
      <Text style={formStyles.aiActionText}>{label}</Text>
    </Pressable>
  );
}

export function AiReplacementCard({
  value,
  onAccept,
  onDismiss,
}: {
  value: string;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={formStyles.replaceCard}>
      <View style={formStyles.replaceHeader}>
        <Ionicons name="sparkles" size={13} color={AI_COLOR} />
        <Text style={formStyles.replaceTitle}>AI version</Text>
      </View>
      <Text style={formStyles.replaceText} numberOfLines={5}>
        {value}
      </Text>
      <View style={formStyles.replaceActions}>
        <Pressable style={formStyles.replaceSecondary} onPress={onDismiss}>
          <Text style={formStyles.replaceSecondaryText}>Keep mine</Text>
        </Pressable>
        <Pressable style={formStyles.replacePrimary} onPress={onAccept}>
          <Text style={formStyles.replacePrimaryText}>Use AI version</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const formStyles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  sectionHeader: {
    gap: 4,
    paddingTop: spacing.lg,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15, 27, 45, 0.1)',
  },
  sectionHeaderFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textStrong,
    backgroundColor: colors.surfaceMuted,
  },
  inputAi: {
    backgroundColor: AI_TINT,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: AI_TINT,
  },
  aiBadgeText: {
    color: AI_COLOR,
    fontSize: 10,
    fontWeight: '700',
  },
  aiAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: AI_TINT,
  },
  aiActionText: {
    color: AI_COLOR,
    fontSize: 12,
    fontWeight: '700',
  },
  replaceCard: {
    gap: 8,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    backgroundColor: AI_TINT,
  },
  replaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  replaceTitle: {
    color: AI_COLOR,
    fontSize: 12,
    fontWeight: '800',
  },
  replaceText: {
    color: colors.textStrong,
    fontSize: 14,
    lineHeight: 20,
  },
  replaceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  replaceSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  replaceSecondaryText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  replacePrimary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: AI_COLOR,
  },
  replacePrimaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
