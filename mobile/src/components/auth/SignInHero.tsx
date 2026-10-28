import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/src/constants/theme';

const FACTORY = require('@/assets/images/auth/factory.jpg');
const RIBBON = require('@/assets/images/auth/ribbon.png');
const RIBBON_ASPECT = 450 / 800;

/** Space left under the cards for the ribbon and the fade into the form. */
const BOTTOM_RESERVE = 72;
const CURVE_SEGMENTS = 20;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Offset = number | `${number}%`;
type ChipPlacement = { left?: Offset; right?: Offset; top?: Offset; bottom?: Offset };

type CardDef = {
  source: number;
  label: string;
  icon: IconName;
  /** Slot position and size as fractions of the hero width (x, w) and card area height (y, h). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Cutout width / height. */
  aspect: number;
  /** Machine height as a multiple of the slot height (capped by the slot width). */
  pop: number;
  chip: ChipPlacement;
};

const CARDS: CardDef[] = [
  {
    source: require('@/assets/images/auth/cnc.png'),
    label: 'CNC Machines',
    icon: 'cog',
    x: 0.04,
    y: 0.12,
    w: 0.55,
    h: 0.4,
    aspect: 480 / 376,
    pop: 1.2,
    chip: { left: 10, bottom: 10 },
  },
  {
    source: require('@/assets/images/auth/robot.png'),
    label: 'Industrial\nRobots',
    icon: 'robot-industrial',
    x: 0.61,
    y: 0.17,
    w: 0.35,
    h: 0.33,
    aspect: 480 / 392,
    pop: 1.22,
    chip: { left: -22, bottom: 2 },
  },
  {
    source: require('@/assets/images/auth/forklift.png'),
    label: 'Material\nHandling',
    icon: 'forklift',
    x: 0.04,
    y: 0.63,
    w: 0.44,
    h: 0.34,
    aspect: 480 / 315,
    pop: 1.2,
    chip: { left: -10, bottom: 8 },
  },
  {
    source: require('@/assets/images/auth/process.png'),
    label: 'Process\nEquipment',
    icon: 'pipe-valve',
    x: 0.52,
    y: 0.62,
    w: 0.45,
    h: 0.34,
    aspect: 480 / 313,
    pop: 1.12,
    chip: { right: 8, bottom: -30 },
  },
];

/** Connector network (fractions as above); nodes outside 0..1 run off the screen edge. */
const NODES: [number, number][] = [
  [-0.04, 0.34],
  [0.28, 0.57],
  [0.6, 0.06],
  [1.04, 0.1],
  [0.6, 0.56],
  [1.04, 0.6],
  [0.49, 0.8],
  [-0.04, 0.84],
];
/** [from, to, bend] where bend bows the curve sideways as a fraction of its length. */
const LINKS: [number, number, number][] = [
  [0, 1, 0.32],
  [1, 4, -0.3],
  [4, 2, 0.3],
  [2, 3, -0.28],
  [4, 5, 0.3],
  [1, 6, 0.3],
  [6, 7, -0.24],
];

type Point = { x: number; y: number };

function CurvedConnector({ from, to, bend }: { from: Point; to: Point; bend: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const control = {
    x: (from.x + to.x) / 2 - (dy / length) * bend * length,
    y: (from.y + to.y) / 2 + (dx / length) * bend * length,
  };

  const at = (t: number): Point => {
    const u = 1 - t;
    return {
      x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
    };
  };

  return (
    <>
      {Array.from({ length: CURVE_SEGMENTS }).map((_, i) => {
        const a = at(i / CURVE_SEGMENTS);
        const b = at((i + 1) / CURVE_SEGMENTS);
        // Slight overlap hides seams between the straight segments.
        const segment = Math.hypot(b.x - a.x, b.y - a.y) + 1;
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        return (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.line,
              {
                width: segment,
                left: (a.x + b.x) / 2 - segment / 2,
                top: (a.y + b.y) / 2 - 1,
                transform: [{ rotate: `${angle}rad` }],
              },
            ]}
          />
        );
      })}
    </>
  );
}

function NodeDot({ x, y, delayMs }: { x: number; y: number; delayMs: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delayMs, t]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + t.value * 0.4,
    transform: [{ scale: 0.8 + t.value * 0.6 }],
  }));

  return (
    <View pointerEvents="none" style={[styles.node, { left: x - 10, top: y - 10 }]}>
      <Animated.View style={[styles.nodeHalo, haloStyle]} />
      <View style={styles.nodeCore} />
    </View>
  );
}

function MachineCard({
  card,
  index,
  areaTop,
  areaHeight,
  width,
}: {
  card: CardDef;
  index: number;
  areaTop: number;
  areaHeight: number;
  width: number;
}) {
  const slotWidth = card.w * width;
  const slotHeight = card.h * areaHeight;
  const machineWidth = Math.min(slotWidth, slotHeight * card.pop * card.aspect);
  const machineHeight = machineWidth / card.aspect;

  return (
    <Animated.View
      entering={FadeInDown.delay(150 + index * 120)
        .springify()
        .damping(16)}
      style={[
        styles.cardSlot,
        {
          left: card.x * width,
          top: areaTop + card.y * areaHeight,
          width: slotWidth,
          height: slotHeight,
        },
      ]}
    >
      <View style={styles.cardFill}>
        <Image
          source={card.source}
          resizeMode="contain"
          style={[
            styles.machine,
            {
              width: machineWidth,
              height: machineHeight,
              left: (slotWidth - machineWidth) / 2,
              bottom: 0,
            },
          ]}
        />

        <View style={[styles.chip, card.chip]}>
          <View style={styles.chipIcon}>
            <MaterialCommunityIcons name={card.icon} size={14} color={colors.accent} />
          </View>
          <Text style={styles.chipText}>{card.label}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function Ribbon({
  width,
  top,
  opacity,
  mirrored = false,
}: {
  width: number;
  top: number;
  opacity: number;
  mirrored?: boolean;
}) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (drift.value - 0.5) * 24 }, { scaleX: mirrored ? -1 : 1 }],
  }));

  const ribbonWidth = width * 1.5;

  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.delay(300).duration(900)}
      style={[styles.ribbonWrap, { top, left: -width * 0.25 }]}
    >
      <Animated.Image
        source={RIBBON}
        style={[{ width: ribbonWidth, height: ribbonWidth * RIBBON_ASPECT, opacity }, style]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export function SignInHero({ height, width }: { height: number; width: number }) {
  const insets = useSafeAreaInsets();
  const areaTop = insets.top + 4;
  const areaHeight = Math.max(220, height - areaTop - BOTTOM_RESERVE);

  const point = ([x, y]: [number, number]): Point => ({
    x: x * width,
    y: areaTop + y * areaHeight,
  });

  return (
    <Animated.View entering={FadeIn.duration(500)} style={[styles.wrap, { height }]}>
      <Image source={FACTORY} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.wash} />
      <LinearGradient
        colors={['rgba(92, 179, 53, 0.55)', 'rgba(120, 200, 90, 0.28)', 'rgba(92, 179, 53, 0.4)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Ribbon width={width} top={areaTop + areaHeight * 0.12} opacity={0.35} mirrored />

      {LINKS.map(([a, b, bend]) => (
        <CurvedConnector
          key={`${a}-${b}`}
          from={point(NODES[a])}
          to={point(NODES[b])}
          bend={bend}
        />
      ))}
      {NODES.map((node, i) => {
        if (node[0] < 0 || node[0] > 1) return null;
        const { x, y } = point(node);
        return <NodeDot key={i} x={x} y={y} delayMs={i * 260} />;
      })}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0)', '#FFFFFF']}
        locations={[0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Ribbon width={width} top={areaTop + areaHeight * 0.66} opacity={0.9} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0)', '#FFFFFF']}
        style={styles.bottomFade}
      />

      {CARDS.map((card, i) => (
        <MachineCard
          key={card.label}
          card={card}
          index={i}
          areaTop={areaTop}
          areaHeight={areaHeight}
          width={width}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#EEF6EA',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_RESERVE,
  },
  line: {
    position: 'absolute',
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#7BE05A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      default: {},
    }),
  },
  node: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeHalo: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(92, 179, 53, 0.4)',
  },
  nodeCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  ribbonWrap: {
    position: 'absolute',
  },
  cardSlot: {
    position: 'absolute',
  },
  cardFill: {
    flex: 1,
  },
  machine: {
    position: 'absolute',
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F1B2D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  chipIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: colors.textStrong,
    fontSize: 10.5,
    lineHeight: 13,
    fontFamily: fonts.semibold,
  },
});
