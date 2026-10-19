import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';

export function SellerSearchBar() {
  const [query, setQuery] = useState('');

  function handleSubmit() {
    const q = query.trim();
    router.push({
      pathname: '/(seller)/(tabs)/listings',
      params: q ? { q } : {},
    });
    setQuery('');
  }

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color={colors.muted} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        placeholder="Search your listings..."
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.input}
      />
      <View style={styles.divider} />
      <Ionicons name="scan-outline" size={22} color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  input: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
});
