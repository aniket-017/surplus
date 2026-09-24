import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/src/constants/theme';

const MIN_VISIBLE_MS = 3800;
const EXIT_MS = 340;
const LOGO_HEIGHT = 88;
const LOGO_WIDTH = LOGO_HEIGHT * 2.8;
const BADGE_SIZE = 68;
const REVOLUTION_MS = 7000;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_CELL = 32;
// The orbit is a tilted ellipse, not a circle: wider on X (deliberately
// dipping icons slightly behind the logo's wide wordmark as they cross left
// /right, like a planet transiting behind a sun) and shorter on Y (reading
// as a disc seen at an angle, with real depth, rather than a flat static
// wheel of identical circles).
const ORBIT_RADIUS_X = Math.max(
  110,
  Math.min(LOGO_WIDTH / 2 + BADGE_SIZE / 2 - 18, SCREEN_WIDTH / 2 - BADGE_SIZE / 2 - 16),
);
const ORBIT_RADIUS_Y = Math.max(95, ORBIT_RADIUS_X * 0.62);
const CENTER_SIZE = ORBIT_RADIUS_X * 2 + BADGE_SIZE + 40;

type OrbitIconDef = {
  key: string;
  source: number;
};

const ORBIT_ICONS: OrbitIconDef[] = [
  { key: 'cnc', source: require('@/assets/icons/splash/cnc.png') },
  { key: 'welding', source: require('@/assets/icons/splash/welding.png') },
  { key: 'forklift', source: require('@/assets/icons/splash/forklift.png') },
  { key: 'gear_spares', source: require('@/assets/icons/splash/gear_spares.png') },
  { key: 'electrical_panel', source: require('@/assets/icons/splash/electrical_panel.png') },
  { key: 'measurement_tools', source: require('@/assets/icons/splash/measurement_tools.png') },
];

type AnimatedSplashProps = {
  readyToExit: boolean;
  onFinished: () => void;
};

function GridBackground() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const { verticals, horizontals } = useMemo(() => {
    const vCount = Math.ceil(SCREEN_WIDTH / GRID_CELL) + 1;
    const hCount = Math.ceil(SCREEN_HEIGHT / GRID_CELL) + 1;
    const v = Array.from({ length: vCount }, (_, i) => ({ i, major: i % 4 === 0 }));
    const h = Array.from({ length: hCount }, (_, i) => ({ i, major: i % 4 === 0 }));
    return { verticals: v, horizontals: h };
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {verticals.map(({ i, major }) => (
        <View
          key={`v-${i}`}
          style={[styles.gridLineV, { left: i * GRID_CELL }, major && styles.gridLineMajor]}
        />
      ))}
      {horizontals.map(({ i, major }) => (
        <View
          key={`h-${i}`}
          style={[styles.gridLineH, { top: i * GRID_CELL }, major && styles.gridLineMajor]}
        />
      ))}
    </Animated.View>
  );
}

function CornerBracket({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = corner === 'tl' || corner === 'tr';
  const isLeft = corner === 'tl' || corner === 'bl';
  return (
    <View
      style={[
        styles.bracket,
        isTop ? { top: 44 } : { bottom: 44 },
        isLeft ? { left: 24 } : { right: 24 },
      ]}
    >
      <View
        style={[
          styles.bracketLineH,
          isTop ? styles.bracketTop : styles.bracketBottom,
          isLeft ? styles.bracketLeftAlign : styles.bracketRightAlign,
        ]}
      />
      <View
        style={[
          styles.bracketLineV,
          isTop ? styles.bracketTop : styles.bracketBottom,
          isLeft ? styles.bracketLeftAlign : styles.bracketRightAlign,
        ]}
      />
    </View>
  );
}

function OrbitIcon({
  index,
  baseAngle,
  angle,
  icon,
}: {
  index: number;
  baseAngle: number;
  angle: SharedValue<number>;
  icon: OrbitIconDef;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const delay = 500 + index * 170;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 620, easing: Easing.out(Easing.back(1.15)) }),
    );
  }, [index, opacity, scale]);

  const style = useAnimatedStyle(() => {
    const a = baseAngle + angle.value;
    // depthT: 0 at the back of the tilted ellipse (top), 1 at the front
    // (bottom) — driving scale/opacity so icons breathe bigger & brighter
    // as they swing to the front, smaller & dimmer at the back. Continuous
    // and different per-icon at any instant, which is what reads as real
    // orbital depth instead of a flat ring of identical circles.
    const depthT = (Math.sin(a) + 1) / 2;
    const depthScale = interpolate(depthT, [0, 1], [0.8, 1.12]);
    const depthOpacity = interpolate(depthT, [0, 1], [0.5, 1]);
    return {
      opacity: opacity.value * depthOpacity,
      transform: [
        { translateX: ORBIT_RADIUS_X * Math.cos(a) },
        { translateY: ORBIT_RADIUS_Y * Math.sin(a) },
        { scale: scale.value * depthScale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.orbitIcon, style]}>
      <View style={styles.badge}>
        <Image source={icon.source} style={styles.badgeImage} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

function OrbitConstellation() {
  const angle = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    ringOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    // Continuous clockwise sweep: screen Y grows downward, so an increasing
    // angle with (cos, sin) reads as clockwise motion, not counter-clockwise.
    angle.value = withRepeat(
      withTiming(Math.PI * 2, { duration: REVOLUTION_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [angle, ringOpacity]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value }));

  return (
    <View style={styles.orbitWrap} pointerEvents="none">
      <Animated.View style={[styles.orbitRing, ringStyle]} />
      {ORBIT_ICONS.map((icon, i) => (
        <OrbitIcon
          key={icon.key}
          index={i}
          baseAngle={-Math.PI / 2 + i * ((Math.PI * 2) / ORBIT_ICONS.length)}
          angle={angle}
          icon={icon}
        />
      ))}
    </View>
  );
}

export function AnimatedSplash({ readyToExit, onFinished }: AnimatedSplashProps) {
  // Start visible so native → JS handoff never flashes blank / black.
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.92);
  const breath = useSharedValue(1);
  const exitProgress = useSharedValue(0);
  const finishedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());
  const exitStartedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishedRef.current();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hideNative = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Native splash may already be hidden.
      }
    };

    // Hide after first paint so JS splash covers the handoff.
    requestAnimationFrame(() => {
      if (!cancelled) void hideNative();
    });

    scale.value = withSpring(1, { damping: 14, stiffness: 130 });
    breath.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );

    return () => {
      cancelled = true;
    };
  }, [breath, scale]);

  useEffect(() => {
    if (!readyToExit || exitStartedRef.current) return;

    const elapsed = Date.now() - mountedAtRef.current;
    const waitMs = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const timer = setTimeout(() => {
      exitStartedRef.current = true;
      breath.value = withTiming(1, { duration: 120 });
      exitProgress.value = withTiming(
        1,
        { duration: EXIT_MS, easing: Easing.in(Easing.cubic) },
        (done) => {
          if (done) runOnJS(finish)();
        },
      );
    }, waitMs);

    return () => clearTimeout(timer);
  }, [breath, exitProgress, finish, readyToExit]);

  const logoStyle = useAnimatedStyle(() => {
    const exitScale = interpolate(exitProgress.value, [0, 1], [1, 1.06]);
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    return {
      opacity: opacity.value * exitOpacity,
      transform: [{ scale: scale.value * breath.value * exitScale }],
    };
  });

  const screenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(exitProgress.value, [0, 1], [1, 0]),
  }));

  return (
    <Animated.View style={[styles.screen, screenStyle]}>
      <StatusBar style="dark" />
      <GridBackground />
      <CornerBracket corner="tl" />
      <CornerBracket corner="tr" />
      <CornerBracket corner="bl" />
      <CornerBracket corner="br" />
      <View style={styles.center}>
        <OrbitConstellation />
        <View style={styles.haloOuter} pointerEvents="none" />
        <View style={styles.haloInner} pointerEvents="none" />
        <Animated.View style={logoStyle}>
          <Image
            source={require('@/assets/logo/surplus.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    width: CENTER_SIZE,
    height: CENTER_SIZE,
  },
  logo: {
    height: LOGO_HEIGHT,
    width: LOGO_WIDTH,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.05)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.05)',
  },
  gridLineMajor: {
    backgroundColor: 'rgba(15, 27, 45, 0.09)',
  },
  bracket: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
  bracketLineH: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: 'rgba(15, 27, 45, 0.16)',
  },
  bracketLineV: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'rgba(15, 27, 45, 0.16)',
  },
  bracketTop: { top: 0 },
  bracketBottom: { bottom: 0 },
  bracketLeftAlign: { left: 0 },
  bracketRightAlign: { right: 0 },
  orbitWrap: {
    position: 'absolute',
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position: 'absolute',
    width: ORBIT_RADIUS_X * 2,
    height: ORBIT_RADIUS_Y * 2,
    borderRadius: ORBIT_RADIUS_X,
    borderWidth: 1,
    borderColor: 'rgba(15, 27, 45, 0.08)',
  },
  haloOuter: {
    position: 'absolute',
    width: LOGO_WIDTH * 0.82,
    height: LOGO_WIDTH * 0.82,
    borderRadius: LOGO_WIDTH * 0.41,
    backgroundColor: colors.accent,
    opacity: 0.05,
  },
  haloInner: {
    position: 'absolute',
    width: LOGO_WIDTH * 0.56,
    height: LOGO_WIDTH * 0.56,
    borderRadius: LOGO_WIDTH * 0.28,
    backgroundColor: colors.accent,
    opacity: 0.07,
  },
  orbitIcon: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -BADGE_SIZE / 2,
    marginTop: -BADGE_SIZE / 2,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(92, 179, 53, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  badgeImage: {
    width: BADGE_SIZE - 22,
    height: BADGE_SIZE - 22,
  },
});
