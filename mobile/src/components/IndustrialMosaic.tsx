import { useEffect } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const TILE_SIZE = 92;
const GAP = 14;
const GRID_CELL = 40;
const FADE_HEIGHT = 160;
const FADE_BANDS = 24;

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

function MarqueeRow({ icons, direction, durationMs }: RowDef) {
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

  const doubled = [...icons, ...icons];

  return (
    <View style={styles.rowClip}>
      <Animated.View style={[styles.row, style]}>
        {doubled.map((source, i) => (
          <Tile key={i} source={source} />
        ))}
      </Animated.View>
    </View>
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
        const opacity = t * t;
        return <View key={i} style={[styles.fadeBand, { opacity }]} />;
      })}
    </View>
  );
}

export function IndustrialMosaic({ height, width }: { height: number; width: number }) {
  return (
    <View style={[styles.wrap, { height }]}>
      <GridTexture width={width} height={height} />
      <View style={styles.rows}>
        {ROWS.map((row, i) => (
          <MarqueeRow key={i} {...row} />
        ))}
      </View>
      <FadeToWhite />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#E8F3E3',
    overflow: 'hidden',
  },
  rows: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingTop: 12,
    paddingBottom: 8,
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
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 27, 45, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F1B2D',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
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
    backgroundColor: 'rgba(15, 27, 45, 0.045)',
  },
  lineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15, 27, 45, 0.045)',
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
