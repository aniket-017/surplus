import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type ShakeProps = {
  /** Shakes whenever this changes to a truthy value. */
  trigger: unknown;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Shake({ trigger, children, style }: ShakeProps) {
  const x = useSharedValue(0);

  useEffect(() => {
    if (!trigger) {
      return;
    }

    x.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withRepeat(withTiming(10, { duration: 80 }), 4, true),
      withTiming(0, { duration: 45 }),
    );
  }, [trigger, x]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
