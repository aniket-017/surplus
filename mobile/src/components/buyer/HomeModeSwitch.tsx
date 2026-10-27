import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, fonts } from '@/src/constants/theme';

export type HomeMode = 'products' | 'services';

export const SERVICE_ORANGE = '#EA580C';

const PADDING = 4;

const SEGMENTS: { mode: HomeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'products', label: 'Products', icon: 'cube' },
  { mode: 'services', label: 'Services', icon: 'hammer' },
];

type HomeModeSwitchProps = {
  mode: HomeMode;
  onChange: (mode: HomeMode) => void;
};

export function HomeModeSwitch({ mode, onChange }: HomeModeSwitchProps) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(mode === 'services' ? 1 : 0);
  const segmentWidth = width > 0 ? (width - PADDING * 2) / SEGMENTS.length : 0;

  useEffect(() => {
    progress.value = withSpring(mode === 'services' ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });
  }, [mode, progress]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: progress.value * segmentWidth }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.accent, SERVICE_ORANGE]),
    shadowColor: interpolateColor(progress.value, [0, 1], [colors.accent, SERVICE_ORANGE]),
  }));

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.track} onLayout={handleLayout} accessibilityRole="tablist">
      {segmentWidth > 0 ? <Animated.View style={[styles.thumb, thumbStyle]} /> : null}

      {SEGMENTS.map((segment) => {
        const active = segment.mode === mode;
        return (
          <Pressable
            key={segment.mode}
            style={styles.segment}
            onPress={() => {
              if (!active) onChange(segment.mode);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Browse ${segment.label.toLowerCase()}`}
          >
            <Ionicons
              name={active ? segment.icon : (`${segment.icon}-outline` as keyof typeof Ionicons.glyphMap)}
              size={17}
              color={active ? colors.white : colors.muted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PADDING,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  thumb: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 999,
  },
  label: {
    color: colors.muted,
    fontSize: 14.5,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
  labelActive: {
    color: colors.white,
  },
});
