import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { formatLocationShort } from '@/src/lib/productFormat';
import type { ProductLocation } from '@/src/types/product';

import { SectionCard } from './SectionCard';

type LocationSectionProps = {
  location: ProductLocation;
};

export function LocationSection({ location }: LocationSectionProps) {
  const query = encodeURIComponent(
    location.address
      ? `${location.address}, ${location.city}, ${location.state} ${location.pincode}`
      : `${location.city}, ${location.state} ${location.pincode}`,
  );

  function openMap() {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  }

  return (
    <SectionCard title="Location" subtitle="Pickup availability">
      <View style={styles.row}>
        <Ionicons name="location" size={20} color={colors.accent} />
        <View style={styles.info}>
          <Text style={styles.primary}>{formatLocationShort(location)}</Text>
          <Text style={styles.secondary}>Pickup Available</Text>
        </View>
      </View>
      <Pressable onPress={openMap} style={styles.mapLink}>
        <Text style={styles.mapLinkText}>View on Map</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.accent} />
      </Pressable>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  primary: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    color: colors.muted,
    fontSize: 14,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  mapLinkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
