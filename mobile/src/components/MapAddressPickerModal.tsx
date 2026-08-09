import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import type { MapPressEvent, Region } from 'react-native-maps';

import { colors, spacing } from '@/src/constants/theme';
import type { UserAddress } from '@/src/types/auth';

const FALLBACK_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
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

type PlacePrediction = {
  place_id: string;
  description: string;
};

export type PickedAddress = {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
};

type MapAddressPickerModalProps = {
  visible: boolean;
  initialAddress?: UserAddress | null;
  onClose: () => void;
  onConfirm: (address: PickedAddress) => void;
};

function buildRegionFromAddress(address?: UserAddress | null): Region {
  if (
    address?.latitude !== undefined &&
    address?.latitude !== null &&
    address?.longitude !== undefined &&
    address?.longitude !== null
  ) {
    return {
      latitude: address.latitude,
      longitude: address.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
  }
  return FALLBACK_REGION;
}

function parseAddressComponents(components: Array<{ long_name?: string; types?: string[] }>) {
  const find = (type: string) =>
    components.find((item) => Array.isArray(item.types) && item.types.includes(type))?.long_name ||
    '';
  const city = find('locality') || find('administrative_area_level_2') || find('sublocality') || '';
  const state = find('administrative_area_level_1');
  const pincode = find('postal_code');
  const streetNumber = find('street_number');
  const route = find('route');
  const sublocality = find('sublocality_level_1') || find('sublocality');
  const street = [streetNumber, route, sublocality].filter(Boolean).join(', ');

  return {
    address: street,
    city,
    state,
    pincode,
  };
}

export function MapAddressPickerModal({
  visible,
  initialAddress,
  onClose,
  onConfirm,
}: MapAddressPickerModalProps) {
  const mapRef = useRef<{ animateToRegion: (region: Region, duration: number) => void } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapSession, setMapSession] = useState(0);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [region, setRegion] = useState<Region>(buildRegionFromAddress(initialAddress));
  const [markerCoord, setMarkerCoord] = useState({
    latitude: buildRegionFromAddress(initialAddress).latitude,
    longitude: buildRegionFromAddress(initialAddress).longitude,
  });
  const [selectedAddress, setSelectedAddress] = useState<PickedAddress | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;

    const nextRegion = buildRegionFromAddress(initialAddress);
    setMapSession((session) => session + 1);
    setRegion(nextRegion);
    setMarkerCoord({ latitude: nextRegion.latitude, longitude: nextRegion.longitude });
    setSelectedAddress(
      initialAddress?.city && initialAddress.state && initialAddress.pincode
        ? {
            address: initialAddress.address?.trim() || '',
            city: initialAddress.city.trim(),
            state: initialAddress.state.trim(),
            pincode: initialAddress.pincode.trim(),
            latitude: nextRegion.latitude,
            longitude: nextRegion.longitude,
          }
        : null,
    );
    setQuery('');
    setPredictions([]);
    setError('');
  }, [visible, initialAddress]);

  useEffect(() => {
    if (!visible) return;
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in mobile/.env to use map search.');
      return;
    }
    setError('');
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!GOOGLE_MAPS_API_KEY) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setPredictions([]);
      setLoadingPredictions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingPredictions(true);
      try {
        const url =
          'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
          `input=${encodeURIComponent(trimmed)}` +
          '&components=country:in' +
          '&types=geocode' +
          `&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const data = (await res.json()) as {
          status?: string;
          error_message?: string;
          predictions?: PlacePrediction[];
        };

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          throw new Error(data.error_message || 'Address search failed');
        }

        setPredictions(data.predictions || []);
      } catch (err) {
        setPredictions([]);
        setError(err instanceof Error ? err.message : 'Failed to search places');
      } finally {
        setLoadingPredictions(false);
      }
    }, 320);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, visible]);

  const canConfirm = useMemo(
    () => Boolean(selectedAddress?.city && selectedAddress?.state && selectedAddress?.pincode),
    [selectedAddress],
  );

  async function reverseGeocode(latitude: number, longitude: number) {
    if (!GOOGLE_MAPS_API_KEY) return;

    setLoadingSelection(true);
    setError('');
    try {
      const url =
        'https://maps.googleapis.com/maps/api/geocode/json?' +
        `latlng=${latitude},${longitude}` +
        '&result_type=street_address|premise|route|neighborhood|locality' +
        `&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = (await res.json()) as {
        status?: string;
        error_message?: string;
        results?: Array<{
          formatted_address?: string;
          address_components?: Array<{ long_name?: string; types?: string[] }>;
        }>;
      };

      if (data.status !== 'OK' || !data.results?.length) {
        throw new Error(data.error_message || 'Could not read address from this pin');
      }

      const first = data.results[0];
      const parsed = parseAddressComponents(first.address_components || []);
      setSelectedAddress({
        address: parsed.address || first.formatted_address || '',
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        latitude,
        longitude,
      });
    } catch (err) {
      setSelectedAddress(null);
      setError(err instanceof Error ? err.message : 'Failed to resolve address');
    } finally {
      setLoadingSelection(false);
    }
  }

  async function handlePredictionPress(prediction: PlacePrediction) {
    if (!GOOGLE_MAPS_API_KEY) return;

    setLoadingSelection(true);
    setError('');
    try {
      const url =
        'https://maps.googleapis.com/maps/api/place/details/json?' +
        `place_id=${encodeURIComponent(prediction.place_id)}` +
        '&fields=geometry,address_components,formatted_address' +
        `&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = (await res.json()) as {
        status?: string;
        error_message?: string;
        result?: {
          formatted_address?: string;
          geometry?: { location?: { lat?: number; lng?: number } };
          address_components?: Array<{ long_name?: string; types?: string[] }>;
        };
      };

      if (data.status !== 'OK' || !data.result?.geometry?.location) {
        throw new Error(data.error_message || 'Could not load place details');
      }

      const lat = data.result.geometry.location.lat;
      const lng = data.result.geometry.location.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('Invalid place coordinates');
      }

      const parsed = parseAddressComponents(data.result.address_components || []);
      const nextRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };

      setRegion(nextRegion);
      setMarkerCoord({ latitude: lat, longitude: lng });
      setSelectedAddress({
        address: parsed.address || data.result.formatted_address || prediction.description,
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        latitude: lat,
        longitude: lng,
      });
      setPredictions([]);
      setQuery(prediction.description);
      mapRef.current?.animateToRegion(nextRegion, 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to choose place');
    } finally {
      setLoadingSelection(false);
    }
  }

  function handleMapPress(event: MapPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  }

  function handleDragEnd(event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  }

  function confirmSelection() {
    if (!selectedAddress || !canConfirm) return;
    onConfirm(selectedAddress);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Pick Address on Map</Text>
                <Text style={styles.subtitle}>Search an address, then fine-tune with pin drag.</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textStrong} />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  setError('');
                }}
                placeholder="Search street, area, or landmark"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                autoCorrect={false}
              />
              {loadingPredictions ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>

            {predictions.length ? (
              <View style={styles.predictionCard}>
                {predictions.slice(0, 5).map((item) => (
                  <Pressable
                    key={item.place_id}
                    style={styles.predictionRow}
                    onPress={() => handlePredictionPress(item)}
                  >
                    <Ionicons name="location-outline" size={16} color={colors.accent} />
                    <Text style={styles.predictionText} numberOfLines={1}>
                      {item.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.mapCard}>
              {NativeMapView && NativeMarker ? (
                <NativeMapView
                  // Remount when the modal opens so initialRegion applies once.
                  // Avoid controlled `region` + onRegionChangeComplete — that feedback
                  // loop can freeze/crash Google Maps on Android emulators.
                  key={`map-${mapSession}`}
                  ref={mapRef}
                  style={styles.map}
                  provider={Platform.OS === 'android' ? NativeProviderGoogle : undefined}
                  initialRegion={region}
                  onPress={handleMapPress}
                >
                  <NativeMarker coordinate={markerCoord} draggable onDragEnd={handleDragEnd} />
                </NativeMapView>
              ) : (
                <View style={styles.mapUnavailable}>
                  <Ionicons name="warning-outline" size={18} color={colors.error} />
                  <Text style={styles.mapUnavailableTitle}>Map view is not available in this build</Text>
                  <Text style={styles.mapUnavailableText}>
                    Rebuild the Android development client after installing native map dependencies.
                  </Text>
                </View>
              )}
              {loadingSelection ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.mapLoadingText}>Resolving address…</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.previewCard}>
              <View style={styles.previewHead}>
                <Ionicons name="home-outline" size={16} color={colors.accent} />
                <Text style={styles.previewTitle}>Selected Address</Text>
              </View>
              <Text style={styles.previewValue}>
                {selectedAddress?.address?.trim() || 'Street details will appear after selection.'}
              </Text>
              <Text style={styles.previewMeta}>
                {selectedAddress
                  ? `${selectedAddress.city || 'City'}, ${selectedAddress.state || 'State'} - ${
                      selectedAddress.pincode || 'Pincode'
                    }`
                  : 'Tap map or search to fill city, state and pincode.'}
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
              onPress={confirmSelection}
              disabled={!canConfirm}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
              <Text style={styles.confirmText}>Use this address</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '96%',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    color: colors.textStrong,
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    paddingVertical: 10,
  },
  predictionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  predictionText: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '600',
  },
  mapCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    height: 250,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoading: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 40, 28, 0.75)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapLoadingText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  mapUnavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.md,
  },
  mapUnavailableTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  mapUnavailableText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    backgroundColor: '#F7FCF8',
    padding: spacing.sm,
    gap: 4,
  },
  previewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '800',
  },
  previewValue: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '600',
  },
  previewMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 17,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.accent,
    paddingVertical: 14,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
