import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SellChooserSheet } from '@/src/components/seller/SellChooserSheet';
import { colors } from '@/src/constants/theme';

const BUTTON_SIZE = 56;

export function SellTabButton({ style }: BottomTabBarButtonProps) {
  const [chooserOpen, setChooserOpen] = useState(false);

  return (
    <>
      <Pressable
        style={[style, styles.container]}
        onPress={() => setChooserOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Sell a product or offer a service"
      >
        {({ pressed }) => (
          <>
            <View style={[styles.circle, pressed && styles.circlePressed]}>
              <Ionicons name="add" size={30} color={colors.white} />
            </View>
            <Text style={styles.label}>Sell</Text>
          </>
        )}
      </Pressable>
      <SellChooserSheet visible={chooserOpen} onClose={() => setChooserOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  circle: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    marginTop: -BUTTON_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  circlePressed: {
    backgroundColor: colors.accentHover,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
