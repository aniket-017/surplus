import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ServiceThumbnail } from '@/src/components/ServiceThumbnail';
import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';
import { formatPrice, formatRelativeDate } from '@/src/lib/productFormat';
import { getImageUrl } from '@/src/lib/productsApi';
import { formatServicePrice, getServiceCategoryTheme } from '@/src/lib/serviceCategories';
import { SERVICE_MODE_LABELS, type Service } from '@/src/types/service';

const GALLERY_HEIGHT = 260;

type ServiceDetailsBodyProps = {
  service: Service;
  horizontalPadding?: number;
};

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoTile}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.accent} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function ServiceDetailsBody({ service, horizontalPadding = 20 }: ServiceDetailsBodyProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const theme = getServiceCategoryTheme(service.category);

  function handleGalleryScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) setActiveIndex(index);
  }

  const infoTiles: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
    { icon: 'business-outline', label: 'Service mode', value: SERVICE_MODE_LABELS[service.serviceMode] },
  ];
  if (service.experienceYears != null) {
    infoTiles.push({
      icon: 'ribbon-outline',
      label: 'Experience',
      value: `${service.experienceYears} year${service.experienceYears === 1 ? '' : 's'}`,
    });
  }
  if (service.turnaround) {
    infoTiles.push({ icon: 'time-outline', label: 'Turnaround', value: service.turnaround });
  }
  if (service.minimumCharge != null) {
    infoTiles.push({
      icon: 'wallet-outline',
      label: 'Minimum charge',
      value: formatPrice(service.minimumCharge),
    });
  }

  return (
    <View>
      {service.images.length > 0 ? (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleGalleryScroll}
            scrollEventThrottle={16}
          >
            {service.images.map((image, index) => (
              <Image
                key={`${image}-${index}`}
                source={{ uri: getImageUrl(image) }}
                style={{ width, height: GALLERY_HEIGHT }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          {service.images.length > 1 ? (
            <View style={styles.dots}>
              {service.images.map((image, index) => (
                <View
                  key={`dot-${image}-${index}`}
                  style={[styles.dot, index === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <ServiceThumbnail
          category={service.category}
          iconSize={72}
          style={{ width, height: GALLERY_HEIGHT * 0.75 }}
        />
      )}

      <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.headerCard}>
          <View style={[styles.categoryPill, { backgroundColor: theme.tint }]}>
            <Ionicons
              name={theme.icon as keyof typeof Ionicons.glyphMap}
              size={13}
              color={theme.color}
            />
            <Text style={[styles.categoryText, { color: theme.color }]}>{service.category}</Text>
          </View>
          <Text style={styles.title}>{service.title}</Text>
          <Text style={styles.price}>{formatServicePrice(service)}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-sharp" size={14} color={colors.accent} />
            <Text style={styles.metaText} numberOfLines={1}>
              {service.location.city}, {service.location.state}
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{formatRelativeDate(service.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {infoTiles.map((tile) => (
            <InfoTile key={tile.label} {...tile} />
          ))}
        </View>

        {service.capabilities.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capabilities</Text>
            <View style={styles.chipRow}>
              {service.capabilities.map((capability) => (
                <View key={capability} style={styles.chip}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
                  <Text style={styles.chipText}>{capability}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this service</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="location" size={16} color={colors.accent} />
            </View>
            <View style={styles.locationCopy}>
              {service.location.address ? (
                <Text style={styles.locationTitle}>{service.location.address}</Text>
              ) : null}
              <Text style={styles.locationSubtitle}>
                {service.location.city}, {service.location.state} - {service.location.pincode}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.white,
  },
  body: {
    gap: spacing.md,
    marginTop: -spacing.lg,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    gap: 8,
    ...cardShadow,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  title: {
    color: colors.textStrong,
    fontSize: 21,
    lineHeight: 27,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.4,
  },
  price: {
    color: '#1B7A34',
    fontSize: 22,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.medium,
    flexShrink: 1,
  },
  metaDot: {
    color: colors.muted,
    marginHorizontal: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 4,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  infoValue: {
    color: colors.textStrong,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontFamily: fonts.extrabold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(92, 179, 53, 0.1)',
  },
  chipText: {
    color: colors.textStrong,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationCopy: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  locationSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
