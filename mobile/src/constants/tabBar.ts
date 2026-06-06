import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/src/constants/theme';

export function useTabScreenOptions() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return {
    headerShown: false as const,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 52 + bottomInset,
      paddingBottom: bottomInset,
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '700' as const,
    },
  };
}
