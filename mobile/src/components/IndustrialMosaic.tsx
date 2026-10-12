import { useEffect } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const TILE_SIZE = 92;
const GAP = 14;
const GRID_CELL = 40;
const FADE_HEIGHT = 180;
const FADE_BANDS = 28;
const TILT_DEG = -8;
/** Rows overhang the screen so the tilt never exposes a row's clipped edge. */
const OVERHANG = 0.25;
const GLOW_LAYERS = [1, 0.82, 0.64, 0.46, 0.28];

type RowDef = {
  icons: number[];
  direction: 'left' | 'right';
  durationMs: number;
};

const ROWS: RowDef[] = [
  {
    icons: [
      require('@/assets/icons/splash/drilling.png'),
      require('@/assets/icons/splash/cnc.png'),
      require('@/assets/icons/splash/welding.png'),
      require('@/assets/icons/splash/forklift.png'),
      require('@/assets/icons/splash/robotics.png'),
    ],
    direction: 'left',
    durationMs: 24000,
  },
  {
    icons: [
      require('@/assets/icons/splash/vmc.png'),
      require('@/assets/icons/splash/lathe.png'),
      require('@/assets/icons/splash/gear_spares.png'),
      require('@/assets/icons/splash/milling.png'),
      require('@/assets/icons/splash/laser_cutting.png'),
    ],
    direction: 'right',
    durationMs: 28000,
  },
  {
    icons: [
      require('@/assets/icons/splash/conveyor.png'),
      require('@/assets/icons/splash/pump.png'),
      require('@/assets/icons/splash/electrical_panel.png'),
      require('@/assets/icons/splash/injection_molding.png'),
      require('@/assets/icons/splash/compressor.png'),
    ],
    direction: 'left',
    durationMs: 26000,
  },
  {
    icons: [
      require('@/assets/icons/splash/measurement_tools.png'),
      require('@/assets/icons/splash/storage_rack.png'),
      require('@/assets/icons/splash/generator.png'),
      require('@/assets/icons/splash/bearing.png'),
      require('@/assets/icons/splash/press_brake.png'),
    ],
    direction: 'right',
    durationMs: 30000,
  },
];

const SET_WIDTH = 5 * (TILE_SIZE + GAP);

function Tile({ source }: { source: number }) {
  return (
    <View style={styles.tile}>
      <Image source={source} style={styles.tileImage} resizeMode="contain" />
    </View>
  );
}

function MarqueeRow({ icons, direction, durationMs, index }: RowDef & { index: number }) {
  const x = useSharedValue(direction === 'left' ? 0 : -SET_WIDTH);

  useEffect(() => {
    const target = direction === 'left' ? -SET_WIDTH : 0;
    x.value = withRepeat(
      withTiming(target, { duration: durationMs, easing: Easing.linear }),
      -1,
      false,
    );
  }, [direction, durationMs, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  // Tripled so the strip still covers the overhanging clip at the loop point.
  const strip = [...icons, ...icons, ...icons];
  const Entering = direction === 'left' ? FadeInRight : FadeInLeft;

  return (
    <Animated.View
      entering={Entering.delay(120 + index * 110)
        .duration(700)
        .easing(Easing.out(Easing.cubic))}
      style={styles.rowClip}
    >
      <Animated.View style={[styles.row, style]}>
        {strip.map((source, i) => (
          <Tile key={i} source={source} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

function GlowBlob({
  size,
  color,
  top,
  left,
  drift,
  durationMs,
  delayMs = 0,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  drift: number;
  durationMs: number;
  delayMs?: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [delayMs, durationMs, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * drift },
      { translateY: t.value * drift * 0.6 },
      { scale: 1 + t.value * 0.15 },
    ],
  }));

  // Stacked rings fake a radial gradient without a native gradient module.
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.blob, { width: size, height: size, top, left }, style]}
    >
      {GLOW_LAYERS.map((scale) => (
        <View
          key={scale}
          style={{
            position: 'absolute',
            width: size * scale,
            height: size * scale,
            borderRadius: (size * scale) / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </Animated.View>
  );
}

function GridTexture({ width, height }: { width: number; height: number }) {
  const vCount = Math.ceil(width / GRID_CELL) + 1;
  const hCount = Math.ceil(height / GRID_CELL) + 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: vCount }).map((_, i) => (
        <View key={`v-${i}`} style={[styles.lineV, { left: i * GRID_CELL }]} />
      ))}
      {Array.from({ length: hCount }).map((_, i) => (
        <View key={`h-${i}`} style={[styles.lineH, { top: i * GRID_CELL }]} />
      ))}
    </View>
  );
}

function FadeToWhite() {
  return (
    <View style={styles.fadeWrap} pointerEvents="none">
      {Array.from({ length: FADE_BANDS }).map((_, i) => {
        // Ease-in curve so the fade starts soft and finishes fully white.
        const t = (i + 1) / FADE_BANDS;
        const opacity = t * t * t;
        return <View key={i} style={[styles.fadeBand, { opacity }]} />;
      })}
    </View>
  );
}

function Sparkle({ top, left, delayMs }: { top: number; left: number; delayMs: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 1600 }),
        ),
        -1,
        false,
      ),
    );
  }, [delayMs, t]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ scale: 0.4 + t.value * 0.8 }, { rotate: '45deg' }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.sparkle, { top, left }, style]} />;
}

export function IndustrialMosaic({ height, width }: { height: number; width: number }) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={[styles.wrap, { height }]}>
      <GridTexture width={width} height={height} />

      <GlowBlob
        size={width * 0.9}
        color="rgba(92, 179, 53, 0.07)"
        top={-width * 0.35}
        left={-width * 0.3}
        drift={40}
        durationMs={7000}
      />
      <GlowBlob
        size={width * 0.8}
        color="rgba(30, 90, 160, 0.035)"
        top={height * 0.35}
        left={width * 0.45}
        drift={-36}
        durationMs={8500}
        delayMs={600}
      />

      <View
        style={[
          styles.rows,
          {
            left: -width * OVERHANG,
            right: -width * OVERHANG,
            transform: [{ rotate: `${TILT_DEG}deg` }],
          },
        ]}
      >
        {ROWS.map((row, i) => (
          <MarqueeRow key={i} index={i} {...row} />
        ))}
      </View>

      <Sparkle top={height * 0.18} left={width * 0.12} delayMs={300} />
      <Sparkle top={height * 0.42} left={width * 0.82} delayMs={1500} />
      <Sparkle top={height * 0.64} left={width * 0.3} delayMs={2600} />

      <FadeToWhite />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#E6F2E0',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rows: {
    position: 'absolute',
    top: -24,
    bottom: 0,
    justifyContent: 'space-evenly',
  },
  rowClip: {
    height: TILE_SIZE,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    marginRight: GAP,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 27, 45, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F1B2D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 5,
      },
      default: {},
    }),
  },
  tileImage: {
    width: TILE_SIZE * 0.7,
    height: TILE_SIZE * 0.7,
  },
  lineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15, 27, 45, 0.05)',
  },
  lineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15, 27, 45, 0.05)',
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#5CB335',
  },
  fadeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FADE_HEIGHT,
    flexDirection: 'column',
  },
  fadeBand: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
