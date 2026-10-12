import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/src/constants/theme';

const SIZE = 8;

export function PulseDot({ color = colors.accent }: { color?: string }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [t]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - t.value),
    transform: [{ scale: 1 + t.value * 1.8 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.dot, styles.ring, { backgroundColor: color }, ringStyle]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  ring: {
    position: 'absolute',
  },
});
