import { StyleSheet, View } from 'react-native';

import { SkeletonBone } from '@/src/components/SkeletonBone';
import { colors, spacing } from '@/src/constants/theme';

const PREVIEW_WIDTHS = ['72%', '58%', '64%', '48%', '68%', '55%', '70%', '52%'] as const;
const NAME_WIDTHS = [140, 118, 152, 110, 134, 124, 146, 116] as const;
const TIME_WIDTHS = [58, 42, 48, 42, 58, 48, 42, 58] as const;

type ConversationListSkeletonProps = {
  count?: number;
};

export function ConversationListSkeleton({ count = 8 }: ConversationListSkeletonProps) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonBone width={52} height={52} radius={12} delay={i * 50} />
          <View style={styles.content}>
            <View style={styles.topRow}>
              <SkeletonBone
                width={NAME_WIDTHS[i % NAME_WIDTHS.length]}
                height={15}
                radius={6}
                delay={i * 50 + 30}
              />
              <SkeletonBone
                width={TIME_WIDTHS[i % TIME_WIDTHS.length]}
                height={11}
                radius={5}
                delay={i * 50 + 50}
              />
            </View>
            <SkeletonBone
              width={PREVIEW_WIDTHS[i % PREVIEW_WIDTHS.length]}
              height={13}
              radius={6}
              delay={i * 50 + 70}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    minHeight: 76,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
});
