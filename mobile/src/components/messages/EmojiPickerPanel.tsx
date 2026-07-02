import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { chatTheme } from '@/src/constants/chatTheme';
import { colors, spacing } from '@/src/constants/theme';

// Curated for B2B / marketplace chat — no romantic or casual-dating emojis.
const EMOJIS = [
  // Polite reactions
  '🙂', '😊', '😀', '😌', '😐', '😅', '😮',
  // Gestures & agreement
  '👍', '👎', '👌', '👋', '🤝', '🙏', '👏',
  // Status & confirmation
  '✅', '❌', '✔️', '⚠️', 'ℹ️', '💯',
  // Commerce & logistics
  '📦', '🛒', '🏷️', '💰', '🧾', '📊', '📈',
  '🚚', '🏭', '📍', '⏰', '📅',
  // Communication & documents
  '📞', '📧', '📝', '📋', '📌', '🔍', '📷', '🔔',
  // Quality
  '⭐', '🌟',
];

type EmojiPickerPanelProps = {
  visible: boolean;
  onSelect: (emoji: string) => void;
};

export function EmojiPickerPanel({ visible, onSelect }: EmojiPickerPanelProps) {
  if (!visible) return null;

  return (
    <View style={styles.panel}>
      <ScrollView
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {EMOJIS.map((emoji, index) => (
          <Pressable
            key={`emoji-${index}`}
            style={styles.emojiButton}
            onPress={() => onSelect(emoji)}
            hitSlop={4}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    maxHeight: 220,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: chatTheme.headerBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emojiButton: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
});
