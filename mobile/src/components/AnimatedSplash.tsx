import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/src/constants/theme';

const MIN_VISIBLE_MS = 1700;
const EXIT_MS = 280;
const LOGO_HEIGHT = 96;
const LOGO_WIDTH = LOGO_HEIGHT * 2.8;

type AnimatedSplashProps = {
  readyToExit: boolean;
  onFinished: () => void;
};

function PulseRings() {
  const a = useSharedValue(0);
  const b = useSharedValue(0);

  useEffect(() => {
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
  }, [a, b]);

  const ringA = useAnimatedStyle(() => ({
    opacity: interpolate(a.value, [0, 1], [0.28, 0]),
    transform: [{ scale: interpolate(a.value, [0, 1], [0.85, 1.35]) }],
  }));
  const ringB = useAnimatedStyle(() => ({
    opacity: interpolate(b.value, [0, 1], [0.18, 0]),
    transform: [{ scale: interpolate(b.value, [0, 1], [0.85, 1.5]) }],
  }));

  return (
    <>
      <Animated.View style={[styles.pulseRing, ringA]} pointerEvents="none" />
      <Animated.View style={[styles.pulseRingOuter, ringB]} pointerEvents="none" />
    </>
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

    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
    breath.value = withDelay(
      350,
      withRepeat(
        withSequence(
          withTiming(1.03, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
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
      <View style={styles.center}>
        <PulseRings />
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    width: LOGO_WIDTH + 96,
    height: LOGO_WIDTH + 96,
  },
  logo: {
    height: LOGO_HEIGHT,
    width: LOGO_WIDTH,
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: colors.accent,
  },
});
