import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ServiceThumbnail } from '@/src/components/ServiceThumbnail';
import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';
import { formatLocationShort } from '@/src/lib/productFormat';
import { formatServicePrice, getServiceCategoryTheme } from '@/src/lib/serviceCategories';
import { SERVICE_MODE_LABELS, type ServiceListing } from '@/src/types/service';

type ServiceListingCardProps = {
  service: ServiceListing;
  width: number;
  onPress: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
};

export function ServiceListingCard({
  service,
  width,
  onPress,
  saved = false,
  onToggleSave,
}: ServiceListingCardProps) {
  const theme = getServiceCategoryTheme(service.category);
  const sellerName = service.seller?.name || 'Seller';
  const highlight =
    service.capabilities[0] ??
    (service.experienceYears != null ? `${service.experienceYears} yrs experience` : null);

  return (
    <View style={[styles.card, { width }]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={service.title}>
        <View>
          <ServiceThumbnail
            image={service.images[0]}
            category={service.category}
            iconSize={40}
            style={styles.image}
          />
          <View style={[styles.categoryBadge, { backgroundColor: theme.color }]}>
            <Ionicons
              name={theme.icon as keyof typeof Ionicons.glyphMap}
              size={10}
              color={colors.white}
            />
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {service.category}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {service.title}
          </Text>
          <Text style={styles.specs} numberOfLines={1}>
            {highlight ?? SERVICE_MODE_LABELS[service.serviceMode]}
          </Text>
          <Text style={[styles.price, service.priceType === 'quote' && styles.quote]}>
            {formatServicePrice(service)}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatLocationShort(service.location)}
            </Text>
          </View>

          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>{sellerName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.sellerName} numberOfLines={1}>
              {sellerName}
            </Text>
            <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
          </View>
        </View>
      </Pressable>

      {onToggleSave ? (
        <Pressable
          style={[styles.saveButton, saved && styles.saveButtonActive]}
          hitSlop={10}
          onPress={onToggleSave}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save service'}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={saved ? colors.accent : colors.textStrong}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  image: {
    width: '100%',
    height: 116,
  },
  categoryBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    maxWidth: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fonts.bold,
    flexShrink: 1,
  },
  content: {
    padding: spacing.sm,
    gap: 4,
  },
  title: {
    color: colors.textStrong,
    fontSize: 13.5,
    fontFamily: fonts.bold,
    lineHeight: 18,
    minHeight: 36,
  },
  specs: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  price: {
    color: '#1B7A34',
    fontSize: 15,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  quote: {
    color: '#EA580C',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sellerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInitial: {
    color: colors.textStrong,
    fontSize: 11,
    fontFamily: fonts.extrabold,
  },
  sellerName: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.semibold,
  },
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  saveButtonActive: {
    backgroundColor: 'rgba(92, 179, 53, 0.18)',
  },
});
