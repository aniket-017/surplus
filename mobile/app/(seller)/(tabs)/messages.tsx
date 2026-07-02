import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConversationList } from '@/src/components/messages/ConversationList';
import { colors, spacing } from '@/src/constants/theme';

export default function SellerMessagesTab() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
      </View>
      <ConversationList emptySubtitle="When buyers inquire on your listings, conversations will appear here." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
