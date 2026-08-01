import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useBreakpoint } from '@/src/hooks/useBreakpoint';

type ScreenContentProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Override max width; defaults to breakpoint contentMaxWidth. */
  maxWidth?: number;
};

export function ScreenContent({ children, style, maxWidth }: ScreenContentProps) {
  const { contentMaxWidth } = useBreakpoint();

  return (
    <View style={[styles.container, { maxWidth: maxWidth ?? contentMaxWidth }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
});
