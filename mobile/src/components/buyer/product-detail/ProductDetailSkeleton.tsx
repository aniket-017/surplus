import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContent } from '@/src/components/ScreenContent';
import { SkeletonBone } from '@/src/components/SkeletonBone';
import { colors, spacing } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';

const THUMB_SIZE = 56;
const STICKY_BAR_HEIGHT = 88;
const BONE = '#E6EBF1';
const BONE_SOFT = '#EDF1F5';

export function ProductDetailSkeleton() {
  const { width: imageWidth } = useBreakpoint();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: STICKY_BAR_HEIGHT + insets.bottom + spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gallery */}
        <View style={styles.gallery}>
          <SkeletonBone width={imageWidth} height={300} radius={0} delay={0} style={styles.hero} />
          <View style={styles.thumbRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonBone
                key={i}
                width={THUMB_SIZE}
                height={THUMB_SIZE}
                radius={10}
                delay={60 + i * 40}
                style={i === 0 ? styles.thumbActive : undefined}
              />
            ))}
          </View>
        </View>

        <ScreenContent>
          <View style={styles.content}>
            {/* Category chips */}
            <View style={styles.chipRow}>
              <SkeletonBone width={64} height={28} radius={999} delay={120} />
              <SkeletonBone width={168} height={28} radius={999} delay={160} />
            </View>

            {/* Title */}
            <View style={styles.titleBlock}>
              <SkeletonBone width="100%" height={26} radius={8} delay={180} />
              <SkeletonBone width="58%" height={26} radius={8} delay={220} />
            </View>

            {/* Meta row */}
            <View style={styles.metaRow}>
              <SkeletonBone width={14} height={14} radius={7} delay={240} />
              <SkeletonBone width={88} height={12} radius={6} delay={260} />
              <SkeletonBone width={6} height={6} radius={3} delay={280} />
              <SkeletonBone width={14} height={14} radius={7} delay={300} />
              <SkeletonBone width={72} height={12} radius={6} delay={320} />
            </View>

            {/* Price */}
            <SkeletonBone width={140} height={30} radius={8} delay={340} style={styles.price} />

            {/* Availability */}
            <View style={styles.availBlock}>
              <SkeletonBone width={150} height={15} radius={6} delay={360} />
              <SkeletonBone width={118} height={13} radius={6} delay={380} />
            </View>

            {/* Quick stats */}
            <View style={styles.statsStrip}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.statItem}>
                  {i > 0 ? <View style={styles.separator} /> : null}
                  <View style={styles.statContent}>
                    <SkeletonBone width={16} height={16} radius={8} delay={400 + i * 40} />
                    <SkeletonBone width={48} height={12} radius={6} delay={420 + i * 40} />
                  </View>
                </View>
              ))}
            </View>

            {/* Seller card preview */}
            <View style={styles.section}>
              <View style={styles.divider} />
              <SkeletonBone width={72} height={18} radius={6} delay={520} />
              <SkeletonBone width={120} height={12} radius={6} delay={540} />
              <View style={styles.sellerRow}>
                <SkeletonBone width={48} height={48} radius={24} delay={560} />
                <View style={styles.sellerInfo}>
                  <SkeletonBone width={110} height={15} radius={6} delay={580} />
                  <SkeletonBone width={140} height={12} radius={6} delay={600} />
                </View>
              </View>
            </View>

            {/* Description preview */}
            <View style={styles.section}>
              <View style={styles.divider} />
              <SkeletonBone width={110} height={18} radius={6} delay={620} />
              <View style={styles.descLines}>
                <SkeletonBone width="100%" height={12} radius={6} delay={640} />
                <SkeletonBone width="100%" height={12} radius={6} delay={660} />
                <SkeletonBone width="72%" height={12} radius={6} delay={680} />
              </View>
            </View>
          </View>
        </ScreenContent>
      </ScrollView>

      {/* Sticky action bar skeleton */}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <ScreenContent style={styles.barInner}>
          <View style={styles.barSummary}>
            <SkeletonBone width={100} height={16} radius={6} delay={200} />
            <SkeletonBone width={120} height={12} radius={6} delay={240} />
          </View>
          <View style={styles.barActions}>
            <SkeletonBone width={44} height={44} radius={12} delay={280} style={styles.barIcon} />
            <SkeletonBone width={128} height={44} radius={12} delay={320} style={styles.barCta} />
          </View>
        </ScreenContent>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  gallery: {
    backgroundColor: BONE_SOFT,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  hero: {
    backgroundColor: BONE,
  },
  thumbRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  thumbActive: {
    borderWidth: 2,
    borderColor: 'rgba(92, 179, 53, 0.35)',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  titleBlock: {
    gap: 8,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  price: {
    marginTop: 6,
  },
  availBlock: {
    gap: 8,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
    marginRight: spacing.xs,
  },
  statContent: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  section: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  sellerInfo: {
    flex: 1,
    gap: 8,
  },
  descLines: {
    gap: 10,
    marginTop: 4,
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  barInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barSummary: {
    flex: 1,
    gap: 6,
  },
  barActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  barIcon: {
    backgroundColor: colors.surfaceMuted,
  },
  barCta: {
    backgroundColor: 'rgba(92, 179, 53, 0.22)',
  },
});
