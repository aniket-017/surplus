import { useEffect, type ReactNode } from 'react';
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

import { colors, radius, spacing } from '@/src/constants/theme';
import { Logo } from '@/src/components/Logo';
import type { UserRole } from '@/src/types/auth';

const LIGHT_GREEN = '#E8F5E9';
const MID_GREEN = '#C8E6C9';
const DEEP_GREEN = '#1F5C38';
const SOFT_NAVY = 'rgba(15, 27, 45, 0.04)';

type RoleSwitchOverlayProps = {
  visible: boolean;
  targetRole: UserRole;
  stage: number;
};

const SELLER_CAPTIONS = [
  {
    title: 'Setting up your warehouse',
    subtitle: 'Preparing a place for your surplus stock',
  },
  {
    title: 'Stocking your inventory',
    subtitle: 'Organizing items you’ll list for buyers',
  },
  {
    title: 'Creating your first listing',
    subtitle: 'Getting your seller workspace ready',
  },
  {
    title: "You're ready to sell",
    subtitle: 'Your seller dashboard is waiting',
  },
] as const;

const BUYER_CAPTIONS = [
  {
    title: 'Finding surplus near you',
    subtitle: 'Looking for deals in your area',
  },
  {
    title: 'Loading the marketplace',
    subtitle: 'Bringing fresh listings into view',
  },
  {
    title: "You're ready to buy",
    subtitle: 'Browse and save what you need',
  },
] as const;

function StageFade({
  active,
  children,
  style,
  delayMs = 0,
  fromScale = 0.88,
  fromY = 18,
}: {
  active: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delayMs?: number;
  fromScale?: number;
  fromY?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(active ? 1 : 0, {
        duration: active ? 520 : 280,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [active, delayMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [fromScale, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [fromY, 0]) },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

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
    opacity: interpolate(a.value, [0, 1], [0.28, 0]),
    transform: [{ scale: interpolate(a.value, [0, 1], [0.86, 1.35]) }],
  }));
  const ringB = useAnimatedStyle(() => ({
    opacity: interpolate(b.value, [0, 1], [0.2, 0]),
    transform: [{ scale: interpolate(b.value, [0, 1], [0.86, 1.45]) }],
  }));

  return (
    <>
      <Animated.View style={[styles.pulseRing, ringA]} pointerEvents="none" />
      <Animated.View style={[styles.pulseRingOuter, ringB]} pointerEvents="none" />
    </>
  );
}

function IdlePulse({ active, children }: { active: boolean; children: ReactNode }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      pulse.value = withTiming(1, { duration: 200 });
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [active, pulse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function FloatChip({
  active,
  delayMs,
  icon,
  style,
}: {
  active: boolean;
  delayMs: number;
  icon: keyof typeof Ionicons.glyphMap;
  style: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(active ? 1 : 0, {
        duration: active ? 480 : 240,
        easing: Easing.out(Easing.cubic),
      }),
    );

    if (active) {
      bob.value = withDelay(
        delayMs + 480,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        ),
      );
    } else {
      bob.value = withTiming(0, { duration: 200 });
    }
  }, [active, bob, delayMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.7, 1]) },
      {
        translateY:
          interpolate(progress.value, [0, 1], [16, 0]) +
          interpolate(bob.value, [0, 1], [0, -5]),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.inventoryChip, style, animatedStyle]}>
      <Ionicons name={icon} size={20} color={colors.accent} />
    </Animated.View>
  );
}

function WarehouseMark() {
  return (
    <View style={styles.warehouseStage}>
      <View style={styles.warehouseShadow} />
      <View style={styles.warehouse}>
        <View style={styles.warehouseRoofRow}>
          <View style={styles.warehouseRoofLeft} />
          <View style={styles.warehouseRoofPeak} />
          <View style={styles.warehouseRoofRight} />
        </View>
        <View style={styles.warehouseBody}>
          <View style={styles.warehouseStripe} />
          <View style={styles.warehouseWindowRow}>
            <View style={styles.warehouseWindow} />
            <View style={styles.warehouseWindow} />
            <View style={styles.warehouseWindow} />
            <View style={styles.warehouseWindow} />
          </View>
          <View style={styles.warehouseBay}>
            <View style={styles.warehouseBayDoor} />
            <View style={styles.warehouseBayDoor} />
          </View>
        </View>
      </View>
      <View style={styles.warehouseBadge}>
        <Ionicons name="storefront-outline" size={18} color={DEEP_GREEN} />
      </View>
    </View>
  );
}

function MiniListingCard() {
  return (
    <View style={styles.listingCard}>
      <View style={styles.listingThumb}>
        <View style={styles.listingThumbInner}>
          <Ionicons name="cube-outline" size={24} color={colors.accent} />
        </View>
      </View>
      <View style={styles.listingCopy}>
        <Text style={styles.listingTitle}>Industrial surplus lot</Text>
        <Text style={styles.listingPrice}>₹12,500</Text>
        <View style={styles.listingMetaRow}>
          <Ionicons name="location-outline" size={12} color={colors.muted} />
          <Text style={styles.listingMeta}>Mumbai · Ready to ship</Text>
        </View>
      </View>
      <View style={styles.listingStatus}>
        <Text style={styles.listingStatusText}>Live</Text>
      </View>
    </View>
  );
}

function ProductTile({
  icon,
  label,
  meta,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  meta: string;
}) {
  return (
    <View style={styles.productTile}>
      <View style={styles.productTileThumb}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <Text style={styles.productTileLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.productTileMeta} numberOfLines={1}>
        {meta}
      </Text>
    </View>
  );
}

function ReadyCheck({ title, subtitle }: { title: string; subtitle: string }) {
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) });
  }, [pop]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: interpolate(pop.value, [0, 1], [0.72, 1]) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ translateY: interpolate(pop.value, [0, 1], [10, 0]) }],
  }));

  return (
    <View style={styles.readyWrap}>
      <View style={styles.readyHalo} />
      <Animated.View style={[styles.readyOuterRing, circleStyle]}>
        <View style={styles.readyCircle}>
          <Ionicons name="checkmark" size={34} color={colors.white} />
        </View>
      </Animated.View>
      <Animated.View style={[styles.readyCopy, textStyle]}>
        <Text style={styles.readyLabel}>{title}</Text>
        <Text style={styles.readySubtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

function StageDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index + 1 === active;
        const isDone = index + 1 < active;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isDone && styles.dotDone,
              isActive && styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  );
}

function SellerScene({ stage }: { stage: number }) {
  const showWarehouse = stage >= 1 && stage < 4;
  const showInventory = stage >= 2 && stage < 4;
  const showListing = stage >= 3 && stage < 4;
  const showReady = stage >= 4;
  const holdOnListing = stage === 3;

  return (
    <View style={styles.scene}>
      <SoftOrb style={styles.orbSeller} />

      <StageFade active={showReady} style={styles.readyStage} fromScale={0.92} fromY={8}>
        <ReadyCheck
          title="You're ready to sell"
          subtitle="Your seller dashboard is waiting"
        />
      </StageFade>

      <StageFade active={showWarehouse} style={styles.storyBlock}>
        <View style={styles.sceneCenter}>
          <PulseRings active={showWarehouse} />
          <WarehouseMark />
          {showInventory ? (
            <>
              <FloatChip
                active={showInventory}
                delayMs={0}
                icon="cube-outline"
                style={styles.chipTopLeft}
              />
              <FloatChip
                active={showInventory}
                delayMs={90}
                icon="settings-outline"
                style={styles.chipTopRight}
              />
              <FloatChip
                active={showInventory}
                delayMs={160}
                icon="flash-outline"
                style={styles.chipBottomLeft}
              />
            </>
          ) : null}
        </View>
      </StageFade>

      <StageFade active={showListing} style={styles.listingWrap} delayMs={60}>
        <IdlePulse active={holdOnListing}>
          <MiniListingCard />
        </IdlePulse>
      </StageFade>
    </View>
  );
}

function BuyerScene({ stage }: { stage: number }) {
  const showBag = stage >= 1 && stage < 3;
  const showTiles = stage >= 2 && stage < 3;
  const showReady = stage >= 3;
  const holdOnTiles = stage === 2;

  return (
    <View style={styles.scene}>
      <SoftOrb style={styles.orbBuyer} />

      <StageFade active={showReady} style={styles.readyStage} fromScale={0.92} fromY={8}>
        <ReadyCheck title="You're ready to buy" subtitle="Browse and save what you need" />
      </StageFade>

      <StageFade active={showBag} style={styles.storyBlock}>
        <View style={styles.sceneCenter}>
          <PulseRings active={showBag} />
          <View style={styles.buyerMark}>
            <Ionicons name="bag-handle-outline" size={44} color={colors.accent} />
          </View>
        </View>
      </StageFade>

      <StageFade active={showTiles} style={styles.tilesRow} delayMs={40}>
        <IdlePulse active={holdOnTiles}>
          <View style={styles.tilesInner}>
            <ProductTile icon="construct-outline" label="Steel scrap" meta="Near you" />
            <ProductTile icon="cube-outline" label="Packaging" meta="Best value" />
          </View>
        </IdlePulse>
      </StageFade>
    </View>
  );
}

function CaptionBlock({
  title,
  subtitle,
  stageKey,
}: {
  title: string;
  subtitle: string;
  stageKey: string;
}) {
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
      <Text style={styles.captionTitle}>{title}</Text>
      <Text style={styles.captionSubtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

export function RoleSwitchOverlay({ visible, targetRole, stage }: RoleSwitchOverlayProps) {
  const captions = targetRole === 'seller' ? SELLER_CAPTIONS : BUYER_CAPTIONS;
  const captionIndex = Math.min(Math.max(stage - 1, 0), captions.length - 1);
  const caption = captions[captionIndex];
  const totalStages = targetRole === 'seller' ? 4 : 3;
  const isReady = targetRole === 'seller' ? stage >= 4 : stage >= 3;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View style={styles.root}>
        <View style={styles.washTop} />
        <View style={styles.washBottom} />

        <View style={styles.content}>
          <Logo size="md" />

          {targetRole === 'seller' ? <SellerScene stage={stage} /> : <BuyerScene stage={stage} />}

          {!isReady ? (
            <CaptionBlock
              title={caption.title}
              subtitle={caption.subtitle}
              stageKey={`${targetRole}-${stage}`}
            />
          ) : (
            <View style={styles.captionSpacer} />
          )}

          <StageDots count={totalStages} active={stage} />
        </View>
      </View>
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
    backgroundColor: 'rgba(92, 179, 53, 0.1)',
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
  content: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  scene: {
    width: '100%',
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneCenter: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
  },
  orbSeller: {
    top: 24,
  },
  orbBuyer: {
    top: 36,
  },
  pulseRing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: MID_GREEN,
  },
  warehouseStage: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  warehouseShadow: {
    position: 'absolute',
    bottom: 6,
    width: 100,
    height: 14,
    borderRadius: 50,
    backgroundColor: SOFT_NAVY,
  },
  warehouse: {
    width: 124,
    alignItems: 'center',
  },
  warehouseRoofRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  warehouseRoofLeft: {
    width: 42,
    height: 18,
    backgroundColor: DEEP_GREEN,
    borderTopLeftRadius: 4,
  },
  warehouseRoofPeak: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.accentHover,
    marginBottom: -1,
  },
  warehouseRoofRight: {
    width: 42,
    height: 18,
    backgroundColor: DEEP_GREEN,
    borderTopRightRadius: 4,
  },
  warehouseBody: {
    width: 118,
    height: 84,
    backgroundColor: colors.accent,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    paddingTop: 12,
    alignItems: 'center',
  },
  warehouseStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  warehouseWindowRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
  warehouseWindow: {
    width: 16,
    height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  warehouseBay: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto',
    marginBottom: 0,
  },
  warehouseBayDoor: {
    width: 34,
    height: 28,
    backgroundColor: LIGHT_GREEN,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  warehouseBadge: {
    position: 'absolute',
    right: -2,
    bottom: 28,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  inventoryChip: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chipTopLeft: {
    top: 10,
    left: -6,
  },
  chipTopRight: {
    top: 22,
    right: -10,
  },
  chipBottomLeft: {
    bottom: 18,
    left: -12,
  },
  listingWrap: {
    position: 'absolute',
    bottom: 8,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  listingThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingThumbInner: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingCopy: {
    flex: 1,
    gap: 3,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textStrong,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  listingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  listingMeta: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  listingStatus: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: LIGHT_GREEN,
  },
  listingStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: DEEP_GREEN,
  },
  buyerMark: {
    width: 108,
    height: 108,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  tilesRow: {
    position: 'absolute',
    bottom: 12,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  tilesInner: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  productTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  productTileThumb: {
    height: 56,
    borderRadius: 10,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textStrong,
  },
  productTileMeta: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  readyStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyWrap: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  readyHalo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    top: -18,
  },
  readyOuterRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 179, 53, 0.06)',
  },
  readyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },
  readyCopy: {
    alignItems: 'center',
    gap: 6,
  },
  readyLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textStrong,
    textAlign: 'center',
  },
  readySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
  },
  captionBlock: {
    alignItems: 'center',
    gap: 6,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  captionSpacer: {
    minHeight: 8,
  },
  captionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textStrong,
    textAlign: 'center',
  },
  captionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 27, 45, 0.12)',
  },
  dotDone: {
    backgroundColor: MID_GREEN,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.accent,
  },
});
