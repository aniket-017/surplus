import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/constants/theme';
import type { UserAddress } from '@/src/types/auth';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const FALLBACK_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const DETAIL_DELTA = 0.008;
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const hasNativeAirMap = Boolean(UIManager.getViewManagerConfig?.('AIRMap'));
const mapsRuntime = hasNativeAirMap
  ? (require('react-native-maps') as {
      default: React.ComponentType<any>;
      PROVIDER_GOOGLE: string;
    })
  : null;
const NativeMapView = mapsRuntime?.default ?? null;
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
      latitudeDelta: DETAIL_DELTA,
      longitudeDelta: DETAIL_DELTA,
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

function formatAddressTitle(address: PickedAddress | null) {
  if (!address) return 'Move the map to select';
  return address.address?.trim() || address.city || 'Selected location';
}

function formatAddressSubtitle(address: PickedAddress | null) {
  if (!address) return 'Search an area or pan the map to set your pin.';
  const parts = [address.city, address.state, address.pincode].filter(Boolean);
  if (address.address?.trim() && parts.length) {
    return parts.join(', ');
  }
  return parts.join(', ') || 'Resolving address details…';
}

export function MapAddressPickerModal({
  visible,
  initialAddress,
  onClose,
  onConfirm,
}: MapAddressPickerModalProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<{ animateToRegion: (region: Region, duration: number) => void } | null>(
    null,
  );
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRegionGeocodeRef = useRef(false);
  const [mapSession, setMapSession] = useState(0);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [region, setRegion] = useState<Region>(buildRegionFromAddress(initialAddress));
  const [selectedAddress, setSelectedAddress] = useState<PickedAddress | null>(null);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [mapMoving, setMapMoving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const nextRegion = buildRegionFromAddress(initialAddress);
    skipRegionGeocodeRef.current = true;
    setMapSession((session) => session + 1);
    setRegion(nextRegion);
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
    setLocating(false);
    setMapMoving(false);
  }, [visible, initialAddress]);

  useEffect(() => {
    if (!visible || !GOOGLE_MAPS_API_KEY) return;
    if (initialAddress?.city && initialAddress.state && initialAddress.pincode) return;

    const nextRegion = buildRegionFromAddress(initialAddress);
    const timer = setTimeout(() => {
      reverseGeocode(nextRegion.latitude, nextRegion.longitude);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open/session
  }, [visible, mapSession]);

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

  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

  const canConfirm = useMemo(
    () => Boolean(selectedAddress?.city && selectedAddress?.state && selectedAddress?.pincode),
    [selectedAddress],
  );

  function animateMapTo(nextRegion: Region) {
    skipRegionGeocodeRef.current = true;
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 350);
  }

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

  function scheduleReverseGeocode(latitude: number, longitude: number) {
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    geocodeTimeoutRef.current = setTimeout(() => {
      reverseGeocode(latitude, longitude);
    }, 280);
  }

  async function handlePredictionPress(prediction: PlacePrediction) {
    if (!GOOGLE_MAPS_API_KEY) return;

    Keyboard.dismiss();
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
        latitudeDelta: DETAIL_DELTA,
        longitudeDelta: DETAIL_DELTA,
      };

      animateMapTo(nextRegion);
      setSelectedAddress({
        address: parsed.address || data.result.formatted_address || prediction.description,
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        latitude: lat,
        longitude: lng,
      });
      setPredictions([]);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to choose place');
    } finally {
      setLoadingSelection(false);
    }
  }

  function handleRegionChange() {
    setMapMoving(true);
    setPredictions([]);
  }

  function handleRegionChangeComplete(next: Region) {
    setMapMoving(false);
    setRegion(next);

    if (skipRegionGeocodeRef.current) {
      skipRegionGeocodeRef.current = false;
      return;
    }

    scheduleReverseGeocode(next.latitude, next.longitude);
  }

  async function handleUseCurrentLocation() {
    if (locating || loadingSelection) return;

    Keyboard.dismiss();
    setLocating(true);
    setError('');
    setPredictions([]);
    setQuery('');

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw new Error('Location services are turned off. Enable them in device settings.');
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error(
          'Location permission was denied. Allow location access in settings to use this feature.',
        );
      }

      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 60_000 })) ||
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

      const { latitude, longitude } = position.coords;
      const nextRegion = {
        latitude,
        longitude,
        latitudeDelta: DETAIL_DELTA,
        longitudeDelta: DETAIL_DELTA,
      };

      animateMapTo(nextRegion);
      await reverseGeocode(latitude, longitude);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not detect your location');
    } finally {
      setLocating(false);
    }
  }

  function focusSearch() {
    searchInputRef.current?.focus();
  }

  function confirmSelection() {
    if (!selectedAddress || !canConfirm) return;
    onConfirm(selectedAddress);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={colors.textStrong} />
            </Pressable>
            <Text style={styles.screenTitle}>Select address</Text>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              ref={searchInputRef}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setError('');
              }}
              placeholder="Search for area, locality, or landmark"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCorrect={false}
              returnKeyType="search"
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
                  <Text style={styles.predictionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.mapArea}>
          {NativeMapView ? (
            <NativeMapView
              key={`map-${mapSession}`}
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={Platform.OS === 'android' ? NativeProviderGoogle : undefined}
              initialRegion={region}
              onRegionChange={handleRegionChange}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mapUnavailable]}>
              <Ionicons name="warning-outline" size={22} color={colors.error} />
              <Text style={styles.mapUnavailableTitle}>Map view is not available in this build</Text>
              <Text style={styles.mapUnavailableText}>
                Rebuild the Android development client after installing native map dependencies.
              </Text>
            </View>
          )}

          {NativeMapView ? (
            <View style={styles.pinAnchor} pointerEvents="none">
              <View style={[styles.pinTooltip, mapMoving && styles.pinTooltipLifted]}>
                <Text style={styles.pinTooltipText}>Your address will be set here</Text>
              </View>
              <View style={[styles.pinTooltipArrow, mapMoving && styles.pinTooltipLifted]} />
              <View style={[styles.pinBody, mapMoving && styles.pinBodyLifted]}>
                <View style={styles.pinHead}>
                  <Ionicons name="home" size={16} color={colors.accent} />
                </View>
                <View style={styles.pinStem} />
              </View>
              <View style={[styles.pinShadow, mapMoving && styles.pinShadowActive]} />
            </View>
          ) : null}

          <View style={styles.currentLocationWrap} pointerEvents="box-none">
            <Pressable
              style={[
                styles.currentLocationChip,
                (locating || loadingSelection) && styles.disabled,
              ]}
              onPress={handleUseCurrentLocation}
              disabled={locating || loadingSelection}
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="locate" size={16} color={colors.accent} />
              )}
              <Text style={styles.currentLocationText}>
                {locating ? 'Detecting location…' : 'Use current location'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.bottomLabel}>Setting your address to</Text>

          <View style={styles.addressCard}>
            <View style={styles.addressIconWrap}>
              {loadingSelection || mapMoving ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="home" size={18} color={colors.accent} />
              )}
            </View>
            <View style={styles.addressTextWrap}>
              <Text style={styles.addressTitle} numberOfLines={1}>
                {formatAddressTitle(selectedAddress)}
              </Text>
              <Text style={styles.addressSubtitle} numberOfLines={2}>
                {formatAddressSubtitle(selectedAddress)}
              </Text>
            </View>
            <Pressable style={styles.changeButton} onPress={focusSearch} hitSlop={6}>
              <Text style={styles.changeButtonText}>Change</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
            onPress={confirmSelection}
            disabled={!canConfirm || loadingSelection}
          >
            <Text style={styles.confirmText}>Confirm address</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topHeader: {
    zIndex: 2,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  mapArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    overflow: 'hidden',
  },
  mapUnavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.lg,
  },
  mapUnavailableTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  mapUnavailableText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  pinAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '42%',
    alignItems: 'center',
  },
  pinTooltip: {
    backgroundColor: colors.textStrong,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 220,
  },
  pinTooltipLifted: {
    transform: [{ translateY: -8 }],
  },
  pinTooltipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  pinTooltipArrow: {
    width: 0,
    height: 0,
    marginBottom: 6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.textStrong,
  },
  pinBody: {
    alignItems: 'center',
  },
  pinBodyLifted: {
    transform: [{ translateY: -10 }],
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.textStrong,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pinStem: {
    width: 3,
    height: 16,
    marginTop: -2,
    backgroundColor: colors.textStrong,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  pinShadow: {
    width: 14,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 27, 45, 0.28)',
    marginTop: 2,
  },
  pinShadowActive: {
    width: 18,
    opacity: 0.45,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 14,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    paddingVertical: 12,
  },
  predictionCard: {
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    maxHeight: 220,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  predictionText: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  currentLocationWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
  },
  currentLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  currentLocationText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  bottomLabel: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bgSubtle,
    padding: spacing.sm,
  },
  addressIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.textStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextWrap: {
    flex: 1,
    gap: 2,
  },
  addressTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  addressSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  changeButton: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  changeButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
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
    paddingVertical: 15,
    marginBottom: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
