import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';

type DetailHeaderProps = {
  onBack: () => void;
  saved: boolean;
  onToggleSave: () => void;
  shareTitle: string;
  shareMessage: string;
};

export function DetailHeader({
  onBack,
  saved,
  onToggleSave,
  shareTitle,
  shareMessage,
}: DetailHeaderProps) {
  async function handleShare() {
    try {
      await Share.share({
        title: shareTitle,
        message: shareMessage,
      });
    } catch {
      // user dismissed
    }
  }

  function handleReport() {
    Alert.alert('Report listing', 'Report functionality is coming soon.');
  }

  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
        <Ionicons name="chevron-back" size={22} color={colors.accent} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Listing details</Text>
      <View style={styles.actions}>
        <Pressable onPress={handleShare} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="share-outline" size={20} color={colors.textStrong} />
        </Pressable>
        <Pressable onPress={onToggleSave} hitSlop={8} style={styles.iconButton}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.accent : colors.textStrong}
          />
        </Pressable>
        <Pressable onPress={handleReport} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="flag-outline" size={20} color={colors.textStrong} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
  },
  backText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  title: {
    color: colors.textStrong,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 4,
  },
});
