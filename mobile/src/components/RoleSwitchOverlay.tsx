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
import type { UserRole } from '@/src/types/auth';

const LIGHT_GREEN = '#E8F5E9';
const ACCENT_SOFT = 'rgba(92, 179, 53, 0.12)';

type RoleSwitchOverlayProps = {
  visible: boolean;
  targetRole: UserRole;
  stage: number;
};

const SELLER_CAPTIONS = [
  'Setting up your warehouse',
  'Stocking your inventory',
  'Creating your first listing',
  "You're ready to sell",
] as const;

const BUYER_CAPTIONS = [
  'Finding surplus near you',
  'Loading the marketplace',
  "You're ready to buy",
] as const;

function StageFade({
  active,
  children,
  style,
  delayMs = 0,
}: {
  active: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delayMs?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(active ? 1 : 0, {
        duration: active ? 420 : 220,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [active, delayMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.86, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [14, 0]) },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function PulseRing({ active }: { active: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      pulse.value = withTiming(0, { duration: 200 });
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [active, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.28]) }],
  }));

  return <Animated.View style={[styles.pulseRing, ringStyle]} pointerEvents="none" />;
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
        withTiming(1.03, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
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

function WarehouseMark() {
  return (
    <View style={styles.warehouse}>
      <View style={styles.warehouseRoof} />
      <View style={styles.warehouseBody}>
        <View style={styles.warehouseDoor} />
        <View style={styles.warehouseWindowRow}>
          <View style={styles.warehouseWindow} />
          <View style={styles.warehouseWindow} />
          <View style={styles.warehouseWindow} />
        </View>
      </View>
      <View style={styles.warehouseBadge}>
        <Ionicons name="business-outline" size={18} color={colors.accent} />
      </View>
    </View>
  );
}

function InventoryChip({
  icon,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.inventoryChip, style]}>
      <Ionicons name={icon} size={18} color={colors.accent} />
    </View>
  );
}

function MiniListingCard() {
  return (
    <View style={styles.listingCard}>
      <View style={styles.listingThumb}>
        <Ionicons name="cube-outline" size={22} color={colors.accent} />
      </View>
      <View style={styles.listingCopy}>
        <View style={styles.listingTitleBar} />
        <Text style={styles.listingPrice}>₹ —</Text>
        <View style={styles.listingMetaRow}>
          <Ionicons name="location-outline" size={11} color={colors.muted} />
          <View style={styles.listingMetaBar} />
        </View>
      </View>
    </View>
  );
}

function ProductTile({ label }: { label: string }) {
  return (
    <View style={styles.productTile}>
      <View style={styles.productTileThumb}>
        <Ionicons name="image-outline" size={16} color={colors.accent} />
      </View>
      <Text style={styles.productTileLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ReadyCheck({ label }: { label: string }) {
  return (
    <View style={styles.readyWrap}>
      <View style={styles.readyCircle}>
        <Ionicons name="checkmark" size={28} color={colors.white} />
      </View>
      <Text style={styles.readyLabel}>{label}</Text>
    </View>
  );
}

function SellerScene({ stage }: { stage: number }) {
  const showWarehouse = stage >= 1;
  const showInventory = stage >= 2;
  const showListing = stage >= 3;
  const showReady = stage >= 4;
  const holdOnListing = stage === 3;

  return (
    <View style={styles.scene}>
      <View style={styles.sceneCenter}>
        <PulseRing active={showWarehouse && !showReady} />
        <StageFade active={showWarehouse && !showReady}>
          <WarehouseMark />
        </StageFade>

        <StageFade active={showInventory && !showReady} delayMs={40} style={styles.inventoryLayer}>
          <InventoryChip icon="cube-outline" style={styles.chipTopLeft} />
          <InventoryChip icon="settings-outline" style={styles.chipTopRight} />
          <InventoryChip icon="hardware-chip-outline" style={styles.chipBottomRight} />
        </StageFade>
      </View>

      <StageFade active={showListing && !showReady} style={styles.listingWrap}>
        <IdlePulse active={holdOnListing}>
          <MiniListingCard />
        </IdlePulse>
      </StageFade>

      <StageFade active={showReady} style={styles.readyStage}>
        <ReadyCheck label="You're ready to sell" />
      </StageFade>
    </View>
  );
}

function BuyerScene({ stage }: { stage: number }) {
  const showBag = stage >= 1;
  const showTiles = stage >= 2;
  const showReady = stage >= 3;
  const holdOnTiles = stage === 2;

  return (
    <View style={styles.scene}>
      <View style={styles.sceneCenter}>
        <PulseRing active={showBag && !showReady} />
        <StageFade active={showBag && !showReady}>
          <View style={styles.buyerMark}>
            <Ionicons name="bag-handle-outline" size={42} color={colors.accent} />
          </View>
        </StageFade>
      </View>

      <StageFade active={showTiles && !showReady} style={styles.tilesRow}>
        <IdlePulse active={holdOnTiles}>
          <View style={styles.tilesInner}>
            <ProductTile label="Steel scrap" />
            <ProductTile label="Packaging" />
          </View>
        </IdlePulse>
      </StageFade>

      <StageFade active={showReady} style={styles.readyStage}>
        <ReadyCheck label="You're ready to buy" />
      </StageFade>
    </View>
  );
}

export function RoleSwitchOverlay({ visible, targetRole, stage }: RoleSwitchOverlayProps) {
  const captions = targetRole === 'seller' ? SELLER_CAPTIONS : BUYER_CAPTIONS;
  const captionIndex = Math.min(Math.max(stage - 1, 0), captions.length - 1);
  const caption = captions[captionIndex];
  const showCaption = !(targetRole === 'seller' ? stage >= 4 : stage >= 3);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View style={styles.root}>
        <View style={styles.wash} />
        <View style={styles.content}>
          {targetRole === 'seller' ? <SellerScene stage={stage} /> : <BuyerScene stage={stage} />}

          {showCaption ? (
            <Text style={styles.caption} key={`${targetRole}-${stage}`}>
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ACCENT_SOFT,
  },
  content: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  scene: {
    width: '100%',
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneCenter: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  warehouse: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  warehouseRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 58,
    borderRightWidth: 58,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.accentHover,
    marginBottom: -2,
  },
  warehouseBody: {
    width: 100,
    height: 72,
    backgroundColor: colors.accent,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  warehouseDoor: {
    width: 28,
    height: 34,
    backgroundColor: LIGHT_GREEN,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  warehouseWindowRow: {
    position: 'absolute',
    top: 12,
    flexDirection: 'row',
    gap: 8,
  },
  warehouseWindow: {
    width: 14,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  warehouseBadge: {
    position: 'absolute',
    right: -6,
    bottom: 18,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  inventoryLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  inventoryChip: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  chipTopLeft: {
    top: 8,
    left: -8,
  },
  chipTopRight: {
    top: 18,
    right: -14,
  },
  chipBottomRight: {
    bottom: 10,
    right: -4,
  },
  listingWrap: {
    marginTop: spacing.md,
    width: '100%',
    maxWidth: 280,
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  listingThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingCopy: {
    flex: 1,
    gap: 6,
  },
  listingTitleBar: {
    height: 10,
    width: '78%',
    borderRadius: 5,
    backgroundColor: colors.surfaceMuted,
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  listingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingMetaBar: {
    height: 7,
    width: 72,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
  },
  buyerMark: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilesRow: {
    marginTop: spacing.md,
    width: '100%',
    maxWidth: 280,
  },
  tilesInner: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  productTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  productTileThumb: {
    height: 48,
    borderRadius: 8,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textStrong,
  },
  readyStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyWrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  readyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textStrong,
    textAlign: 'center',
  },
  caption: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
    minHeight: 24,
  },
});
