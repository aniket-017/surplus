import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/src/constants/theme';

const BUTTON_SIZE = 56;

export function SellTabButton({ style }: BottomTabBarButtonProps) {
  return (
    <Pressable
      style={[style, styles.container]}
      onPress={() => router.push('/(seller)/add-product')}
      accessibilityRole="button"
      accessibilityLabel="Sell a new item"
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
