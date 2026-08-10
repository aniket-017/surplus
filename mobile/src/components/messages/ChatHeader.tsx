import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { chatTheme } from '@/src/constants/chatTheme';
import { colors, spacing } from '@/src/constants/theme';
import { getImageUrl } from '@/src/lib/productsApi';

type ChatHeaderProps = {
  otherParty: { name: string; avatarUrl: string | null } | null;
  product: { id: string; title: string; images: string[] } | null;
  onBack: () => void;
  onProductPress?: () => void;
};

export function ChatHeader({ otherParty, product, onBack, onProductPress }: ChatHeaderProps) {
  const title = otherParty?.name || 'User';
  const productImage = product?.images?.[0];

  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
        <Ionicons name="chevron-back" size={26} color={colors.textStrong} />
      </Pressable>

      <Pressable style={styles.center} onPress={onProductPress} disabled={!onProductPress}>
        {productImage ? (
          <Image source={{ uri: getImageUrl(productImage) }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="cube-outline" size={22} color={colors.muted} />
          </View>
        )}
        <View style={styles.textBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </Pressable>

      {onProductPress ? (
        <Pressable onPress={onProductPress} hitSlop={8} style={styles.productButton}>
          <Ionicons name="open-outline" size={20} color={colors.textStrong} />
        </Pressable>
      ) : (
        <View style={styles.productButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: chatTheme.headerBg,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: chatTheme.headerBorder,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  productButton: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
