import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';
import { formatListingPrice, formatLocationShort, formatPrice } from '@/src/lib/productFormat';
import { getImageUrl } from '@/src/lib/productsApi';
import type { ProductListing } from '@/src/types/product';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type LatLng = { latitude: number; longitude: number };

type MapHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (
    coordinates: LatLng[],
    options?: {
      edgePadding?: { top: number; right: number; bottom: number; left: number };
      animated?: boolean;
    },
  ) => void;
};

type MapPin = {
  product: ProductListing;
  coordinate: LatLng;
};

const DEFAULT_CENTER: LatLng = { latitude: 18.5204, longitude: 73.8567 };
const DEFAULT_DELTA = 0.15;
const SINGLE_PIN_DELTA = 0.05;
const OVERLAP_SPREAD_DEGREES = 0.0008;
const INLINE_HEIGHT = 420;

const hasNativeAirMap = Boolean(UIManager.getViewManagerConfig?.('AIRMap'));
const mapsRuntime = hasNativeAirMap
  ? (require('react-native-maps') as {
      default: React.ComponentType<any>;
      Marker: React.ComponentType<any>;
      PROVIDER_GOOGLE: string;
    })
  : null;
const NativeMapView = mapsRuntime?.default ?? null;
const NativeMarker = mapsRuntime?.Marker ?? null;
const NativeProviderGoogle = mapsRuntime?.PROVIDER_GOOGLE;

function hasCoordinates(product: ProductListing) {
  const { latitude, longitude } = product.location;
  return typeof latitude === 'number' && typeof longitude === 'number';
}

/** Listings at the exact same point are fanned out in a small circle so each pin stays tappable. */
function buildPins(products: ProductListing[]): MapPin[] {
  const groups = new Map<string, ProductListing[]>();

  for (const product of products) {
    if (!hasCoordinates(product)) continue;
    const key = `${product.location.latitude!.toFixed(5)},${product.location.longitude!.toFixed(5)}`;
    const group = groups.get(key);
    if (group) {
      group.push(product);
    } else {
      groups.set(key, [product]);
    }
  }

  const pins: MapPin[] = [];
  for (const group of groups.values()) {
    group.forEach((product, index) => {
      const latitude = product.location.latitude!;
      const longitude = product.location.longitude!;

      if (group.length === 1) {
        pins.push({ product, coordinate: { latitude, longitude } });
        return;
      }

      const angle = (2 * Math.PI * index) / group.length;
      const radius = OVERLAP_SPREAD_DEGREES * Math.max(1, group.length / 6);
      pins.push({
        product,
        coordinate: {
          latitude: latitude + radius * Math.sin(angle),
          longitude:
            longitude + (radius * Math.cos(angle)) / Math.cos((latitude * Math.PI) / 180),
        },
      });
    });
  }

  return pins;
}

function initialRegionFor(pins: MapPin[], fallbackCenter?: LatLng | null): Region {
  if (pins.length) {
    return {
      ...pins[0].coordinate,
      latitudeDelta: SINGLE_PIN_DELTA,
      longitudeDelta: SINGLE_PIN_DELTA,
    };
  }
  return {
    ...(fallbackCenter ?? DEFAULT_CENTER),
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };
}

const MARKER_REDRAW_MS = 300;

type PriceMarkerProps = {
  pin: MapPin;
  active: boolean;
  onPress: () => void;
};

/**
 * Keys must stay stable: remounting markers inside an existing map crashes AIRMap under the
 * new architecture interop layer. Style changes are redrawn by briefly tracking view changes.
 */
function PriceMarker({ pin, active, onPress }: PriceMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), MARKER_REDRAW_MS);
    return () => clearTimeout(timer);
  }, [active]);

  if (!NativeMarker) return null;

  return (
    <NativeMarker
      coordinate={pin.coordinate}
      tracksViewChanges={tracksViewChanges}
      zIndex={active ? 2 : 1}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
    >
      <View style={[styles.pricePin, active && styles.pricePinActive]}>
        <Text style={[styles.pricePinText, active && styles.pricePinTextActive]}>
          {formatPrice(pin.product.price)}
        </Text>
      </View>
    </NativeMarker>
  );
}

type ListingsMapProps = {
  pins: MapPin[];
  totalCount: number;
  fallbackCenter?: LatLng | null;
  loading?: boolean;
  fullscreen?: boolean;
  topInset?: number;
  bottomInset?: number;
  onExpand?: () => void;
  onClose?: () => void;
  onOpenProduct: (productId: string) => void;
};

function ListingsMap({
  pins,
  totalCount,
  fallbackCenter,
  loading = false,
  fullscreen = false,
  topInset = 0,
  bottomInset = 0,
  onExpand,
  onClose,
  onOpenProduct,
}: ListingsMapProps) {
  const mapRef = useRef<MapHandle | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const initialRegion = useMemo(
    () => initialRegionFor(pins, fallbackCenter),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only for first render of the map
    [],
  );

  const selected = pins.find((pin) => pin.product.id === selectedId)?.product ?? null;
  const hiddenCount = totalCount - pins.length;
  const overlayTop = topInset + spacing.sm;

  function fitToPins(animated: boolean) {
    const map = mapRef.current;
    if (!map) return;

    if (pins.length > 1) {
      map.fitToCoordinates(
        pins.map((pin) => pin.coordinate),
        {
          edgePadding: {
            top: overlayTop + 60,
            right: 60,
            bottom: bottomInset + (selected ? 160 : 60),
            left: 60,
          },
          animated,
        },
      );
    } else {
      map.animateToRegion(initialRegionFor(pins, fallbackCenter), animated ? 350 : 0);
    }
  }

  function handleMapPress(event: { nativeEvent?: { action?: string } }) {
    if (event?.nativeEvent?.action === 'marker-press') return;
    setSelectedId(null);
  }

  if (!NativeMapView || !NativeMarker) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.unavailable]}>
        <Ionicons name="warning-outline" size={22} color={colors.error} />
        <Text style={styles.unavailableTitle}>Map view is not available in this build</Text>
        <Text style={styles.unavailableText}>
          Rebuild the development client after installing native map dependencies.
        </Text>
        {fullscreen && onClose ? (
          <Pressable style={styles.unavailableClose} onPress={onClose}>
            <Text style={styles.unavailableCloseText}>Close</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <NativeMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? NativeProviderGoogle : undefined}
        initialRegion={initialRegion}
        onMapReady={() => fitToPins(false)}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        {pins.map((pin) => (
          <PriceMarker
            key={pin.product.id}
            pin={pin}
            active={pin.product.id === selectedId}
            onPress={() => setSelectedId(pin.product.id)}
          />
        ))}
      </NativeMapView>

      {fullscreen ? (
        <View style={[styles.topLeft, { top: overlayTop }]}>
          <Pressable
            style={styles.iconButton}
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close map"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textStrong} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.topRight, { top: overlayTop }]}>
        {!fullscreen && onExpand ? (
          <Pressable
            style={styles.iconButton}
            onPress={onExpand}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open full-screen map"
          >
            <Ionicons name="expand-outline" size={18} color={colors.textStrong} />
          </Pressable>
        ) : null}
        <Pressable
          style={styles.iconButton}
          onPress={() => fitToPins(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Show all listings"
        >
          <Ionicons name="locate-outline" size={18} color={colors.textStrong} />
        </Pressable>
      </View>

      {loading ? (
        <View style={[styles.statusPill, { top: overlayTop }]}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      ) : hiddenCount > 0 || totalCount === 0 ? (
        <View style={[styles.statusPill, { top: overlayTop }]}>
          <Text style={styles.statusText}>
            {totalCount === 0
              ? 'No listings to show'
              : `${pins.length} of ${totalCount} listings shown`}
          </Text>
        </View>
      ) : null}

      {selected ? (
        <Pressable
          style={[styles.preview, { bottom: bottomInset + spacing.sm }]}
          onPress={() => onOpenProduct(selected.id)}
          accessibilityRole="button"
          accessibilityLabel={selected.title}
        >
          {selected.images[0] ? (
            <Image
              source={{ uri: getImageUrl(selected.images[0]) }}
              style={styles.previewImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.previewImage, styles.previewImageFallback]} />
          )}
          <View style={styles.previewBody}>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {selected.title}
            </Text>
            <Text style={styles.previewPrice} numberOfLines={1}>
              {formatListingPrice(selected)}
            </Text>
            <View style={styles.previewLocationRow}>
              <Ionicons name="location-outline" size={12} color={colors.muted} />
              <Text style={styles.previewLocation} numberOfLines={1}>
                {formatLocationShort(selected.location)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

type ListingsMapViewProps = {
  products: ProductListing[];
  onOpenProduct: (productId: string) => void;
  fallbackCenter?: LatLng | null;
  loading?: boolean;
  height?: number;
};

export function ListingsMapView({
  products,
  onOpenProduct,
  fallbackCenter,
  loading = false,
  height = INLINE_HEIGHT,
}: ListingsMapViewProps) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const pins = useMemo(() => buildPins(products), [products]);
  const pinsKey = useMemo(() => pins.map((pin) => pin.product.id).join(','), [pins]);

  function openProduct(productId: string) {
    setExpanded(false);
    onOpenProduct(productId);
  }

  return (
    <View style={[styles.card, { height }]}>
      <ListingsMap
        key={pinsKey}
        pins={pins}
        totalCount={products.length}
        fallbackCenter={fallbackCenter}
        loading={loading}
        onExpand={() => setExpanded(true)}
        onOpenProduct={openProduct}
      />

      <Modal
        visible={expanded}
        animationType="slide"
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.fullscreen}>
          <ListingsMap
            key={pinsKey}
            pins={pins}
            totalCount={products.length}
            fallbackCenter={fallbackCenter}
            loading={loading}
            fullscreen
            topInset={insets.top}
            bottomInset={insets.bottom}
            onClose={() => setExpanded(false)}
            onOpenProduct={openProduct}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  pricePin: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pricePinActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  pricePinText: {
    color: colors.textStrong,
    fontSize: 13,
    fontFamily: fonts.extrabold,
  },
  pricePinTextActive: {
    color: colors.white,
  },
  topLeft: {
    position: 'absolute',
    left: spacing.sm,
  },
  topRight: {
    position: 'absolute',
    right: spacing.sm,
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  statusPill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 34,
    justifyContent: 'center',
    ...cardShadow,
  },
  statusText: {
    color: colors.textStrong,
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  preview: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xs,
    ...cardShadow,
  },
  previewImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  previewImageFallback: {
    backgroundColor: colors.surfaceMuted,
  },
  previewBody: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    color: colors.textStrong,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.bold,
  },
  previewPrice: {
    color: colors.textStrong,
    fontSize: 15,
    fontFamily: fonts.extrabold,
  },
  previewLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewLocation: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  unavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSubtle,
  },
  unavailableTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  unavailableText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  unavailableClose: {
    marginTop: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  unavailableCloseText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
});
