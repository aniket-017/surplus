import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/src/components/Logo';
import { colors, radius, spacing } from '@/src/constants/theme';
import type { LocalImage } from '@/src/types/product';

const HERO_SIZE = 268;
const SCAN_DURATION_MS = 2200;
const CAPTION_INTERVAL_MS = 2200;
const MID_GREEN = '#C8E6C9';

const CAPTIONS = [
  {
    title: 'Scanning your photos',
    subtitle: 'Reading materials and details',
  },
  {
    title: 'Understanding the product',
    subtitle: 'Matching category and specs',
  },
  {
    title: 'Drafting your listing',
    subtitle: 'Preparing title and description',
  },
] as const;

type AnalyzeAiOverlayProps = {
  visible: boolean;
  images: LocalImage[];
};

function SoftOrb({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.orb, style]} pointerEvents="none" />;
}

function PulseRings({ active }: { active: boolean }) {
  const a = useSharedValue(0);
  const b = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      a.value = withTiming(0, { duration: 200 });
      b.value = withTiming(0, { duration: 200 });
      return;
    }

    a.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
    b.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [a, active, b]);

  const ringA = useAnimatedStyle(() => ({
    opacity: interpolate(a.value, [0, 1], [0.32, 0]),
    transform: [{ scale: interpolate(a.value, [0, 1], [0.9, 1.28]) }],
  }));
  const ringB = useAnimatedStyle(() => ({
    opacity: interpolate(b.value, [0, 1], [0.22, 0]),
    transform: [{ scale: interpolate(b.value, [0, 1], [0.9, 1.4]) }],
  }));

  return (
    <>
      <Animated.View style={[styles.pulseRing, ringA]} pointerEvents="none" />
      <Animated.View style={[styles.pulseRingOuter, ringB]} pointerEvents="none" />
    </>
  );
}

function HudCorners() {
  return (
    <View style={styles.hud} pointerEvents="none">
      <View style={[styles.hudCorner, styles.hudTopLeft]} />
      <View style={[styles.hudCorner, styles.hudTopRight]} />
      <View style={[styles.hudCorner, styles.hudBottomLeft]} />
      <View style={[styles.hudCorner, styles.hudBottomRight]} />
    </View>
  );
}

function ScanBeam({ active, height }: { active: boolean; height: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = withTiming(0, { duration: 200 });
      return;
    }

    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: SCAN_DURATION_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [0, Math.max(height - 28, 0)]),
      },
    ],
    opacity: interpolate(progress.value, [0, 0.08, 0.92, 1], [0.35, 1, 1, 0.35]),
  }));

  return (
    <Animated.View style={[styles.scanBeam, style]} pointerEvents="none">
      <View style={styles.scanGlow} />
      <View style={styles.scanLine} />
    </Animated.View>
  );
}

function CaptionBlock({ title, subtitle, stageKey }: { title: string; subtitle: string; stageKey: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [progress, stageKey]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [8, 0]) }],
  }));

  return (
    <Animated.View style={[styles.captionBlock, style]}>
      <View style={styles.captionBadge}>
        <Ionicons name="sparkles" size={14} color={colors.accent} />
        <Text style={styles.captionBadgeText}>AI analyzing</Text>
      </View>
      <Text style={styles.captionTitle}>{title}</Text>
      <Text style={styles.captionSubtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

function StageEnter({ active, children }: { active: boolean; children: ReactNode }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: active ? 420 : 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.94, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [14, 0]) },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export function AnalyzeAiOverlay({ visible, images }: AnalyzeAiOverlayProps) {
  const [captionIndex, setCaptionIndex] = useState(0);
  const hero = images[0];
  const extras = images.slice(1, 4);

  useEffect(() => {
    if (!visible) {
      setCaptionIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setCaptionIndex((current) => (current + 1) % CAPTIONS.length);
    }, CAPTION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [visible]);

  const caption = CAPTIONS[captionIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.washTop} />
        <View style={styles.washBottom} />
        <SoftOrb style={styles.orbCenter} />

        <View style={styles.content}>
          <Logo size="md" />

          <StageEnter active={visible}>
            <View style={styles.stage}>
              <View style={styles.heroStage}>
                <PulseRings active={visible} />

                <View style={styles.heroFrame}>
                  {hero ? (
                    <Image source={{ uri: hero.uri }} style={styles.heroImage} contentFit="cover" />
                  ) : (
                    <View style={styles.heroPlaceholder}>
                      <Ionicons name="image-outline" size={36} color={colors.muted} />
                    </View>
                  )}

                  <View style={styles.scanClip} pointerEvents="none">
                    <ScanBeam active={visible} height={HERO_SIZE} />
                  </View>

                  <HudCorners />
                </View>
              </View>

              {extras.length > 0 ? (
                <View style={styles.thumbRow}>
                  {extras.map((image, index) => (
                    <View key={`${image.uri}-${index}`} style={styles.thumbWrap}>
                      <Image source={{ uri: image.uri }} style={styles.thumbImage} contentFit="cover" />
                      <View style={styles.thumbScanHint} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </StageEnter>

          <CaptionBlock
            title={caption.title}
            subtitle={caption.subtitle}
            stageKey={`caption-${captionIndex}`}
          />

          <View style={styles.dots}>
            {CAPTIONS.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === captionIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7FAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  washTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
  },
  washBottom: {
    position: 'absolute',
    bottom: -60,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(15, 27, 45, 0.04)',
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(92, 179, 53, 0.07)',
  },
  orbCenter: {
    top: '28%',
  },
  content: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  stage: {
    width: '100%',
    minHeight: HERO_SIZE + 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  heroStage: {
    width: HERO_SIZE + 36,
    height: HERO_SIZE + 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: HERO_SIZE + 28,
    height: HERO_SIZE + 28,
    borderRadius: (HERO_SIZE + 28) / 2,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  pulseRingOuter: {
    position: 'absolute',
    width: HERO_SIZE + 28,
    height: HERO_SIZE + 28,
    borderRadius: (HERO_SIZE + 28) / 2,
    borderWidth: 1,
    borderColor: MID_GREEN,
  },
  heroFrame: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'rgba(92, 179, 53, 0.22)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 28,
  },
  scanGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(92, 179, 53, 0.18)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 4,
  },
  hud: {
    ...StyleSheet.absoluteFillObject,
  },
  hudCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: colors.accent,
  },
  hudTopLeft: {
    top: 10,
    left: 10,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 4,
  },
  hudTopRight: {
    top: 10,
    right: 10,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 4,
  },
  hudBottomLeft: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 4,
  },
  hudBottomRight: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 4,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(92, 179, 53, 0.35)',
    backgroundColor: colors.surfaceMuted,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbScanHint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
  },
  captionBlock: {
    alignItems: 'center',
    gap: 6,
    minHeight: 88,
  },
  captionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    marginBottom: 4,
  },
  captionBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  captionTitle: {
    color: colors.textStrong,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  captionSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 27, 45, 0.14)',
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 18,
  },
});
