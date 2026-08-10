import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export const SKELETON_BONE = '#E6EBF1';

type SkeletonBoneProps = {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBone({
  width = '100%',
  height,
  radius = 8,
  delay = 0,
  style,
}: SkeletonBoneProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.55, 1]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: SKELETON_BONE,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}
