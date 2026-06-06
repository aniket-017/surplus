import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/constants/theme';
import { getImageUrl } from '@/src/lib/productsApi';

export default function ProductDetailScreen() {
  const { title, category, price, image } = useLocalSearchParams<{
    title?: string;
    category?: string;
    price?: string;
    image?: string;
  }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {image ? (
          <Image source={{ uri: getImageUrl(image) }} style={styles.heroImage} contentFit="cover" />
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{category}</Text>
        <Text style={styles.price}>₹{price}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  title: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
  },
  price: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
  },
});
