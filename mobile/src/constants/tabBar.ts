import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/src/constants/theme';

const ANDROID_MIN_TAB_BAR_INSET = 48;

export function useTabSafeAreaInsets() {
  const insets = useSafeAreaInsets();

  const bottom =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, ANDROID_MIN_TAB_BAR_INSET)
      : insets.bottom;

  return {
    top: insets.top,
    right: insets.right,
    bottom,
    left: insets.left,
  };
}

export function useTabScreenOptions() {
  return {
    headerShown: false as const,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '700' as const,
    },
  };
}
