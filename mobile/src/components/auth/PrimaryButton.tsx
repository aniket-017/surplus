import { useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/src/constants/theme';

const SHINE_WIDTH = 70;

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function PrimaryButton({ label, onPress, disabled, loading }: PrimaryButtonProps) {
  const enabled = useSharedValue(disabled ? 0 : 1);
  const pressed = useSharedValue(0);
  const shine = useSharedValue(0);
  const nudge = useSharedValue(0);
  const width = useSharedValue(0);

  const active = !disabled && !loading;

  useEffect(() => {
    enabled.value = withTiming(disabled ? 0 : 1, { duration: 320 });
  }, [disabled, enabled]);

  useEffect(() => {
    if (!active) {
      cancelAnimation(shine);
      cancelAnimation(nudge);
      shine.value = 0;
      nudge.value = 0;
      return;
    }

    shine.value = 0;
    shine.value = withRepeat(
      withDelay(1200, withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) })),
      -1,
      false,
    );
    nudge.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [active, nudge, shine]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(enabled.value, [0, 1], ['#BFE0AE', colors.accent]),
    shadowOpacity: interpolate(enabled.value, [0, 1], [0, 0.35]),
    transform: [{ scale: 1 - pressed.value * 0.035 }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shine.value, [0, 1], [-SHINE_WIDTH * 2, width.value + SHINE_WIDTH]),
      },
      { skewX: '-20deg' },
    ],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nudge.value * 4 + pressed.value * 6 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 12, stiffness: 220 });
      }}
    >
      <Animated.View
        style={[styles.button, containerStyle]}
        onLayout={(event) => {
          width.value = event.nativeEvent.layout.width;
        }}
      >
        <Animated.View pointerEvents="none" style={styles.shineClip}>
          <Animated.View style={[styles.shine, shineStyle]} />
        </Animated.View>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.label}>{label}</Text>
            <Animated.Text style={[styles.arrow, arrowStyle]}>→</Animated.Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: radius.md + 2,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 18,
      },
      default: {},
    }),
  },
  shineClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md + 2,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: 0,
    width: SHINE_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  label: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  arrow: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
});
