import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useRoleSwitch } from '@/src/context/RoleSwitchContext';
import { colors, fonts } from '@/src/constants/theme';

const BUTTON_SIZE = 56;

export function BuyerSellTabButton({ style }: BottomTabBarButtonProps) {
  const { switchRole, switching } = useRoleSwitch();
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    if (busy || switching) return;

    setBusy(true);
    try {
      await switchRole('seller');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to switch to seller');
      setBusy(false);
    }
  }

  return (
    <Pressable
      style={[style, styles.container]}
      onPress={() => void handlePress()}
      disabled={busy || switching}
      accessibilityRole="button"
      accessibilityLabel="Sell a new item"
    >
      {({ pressed }) => (
        <>
          <View style={[styles.circle, (pressed || busy || switching) && styles.circlePressed]}>
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
    fontFamily: fonts.bold,
    marginTop: 2,
  },
});
