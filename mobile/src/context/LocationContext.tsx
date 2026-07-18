import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { BuyerLocation } from '@/src/types/location';

const LOCATION_KEY = 'surplus_buyer_location';

type LocationContextValue = {
  location: BuyerLocation | null;
  loadingLocation: boolean;
  detectingLocation: boolean;
  setManualLocation: (city: string, state: string) => Promise<void>;
  detectCurrentLocation: () => Promise<BuyerLocation>;
  clearLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function parseStoredLocation(raw: string | null): BuyerLocation | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<BuyerLocation>;
    if (typeof parsed.city === 'string' && parsed.city.trim()) {
      return {
        city: parsed.city.trim(),
        state: typeof parsed.state === 'string' ? parsed.state.trim() : '',
        source: parsed.source === 'gps' || parsed.source === 'manual' ? parsed.source : 'manual',
      };
    }
  } catch {
    // Ignore corrupted stored value; it will be overwritten on next selection.
  }

  return null;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<BuyerLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await SecureStore.getItemAsync(LOCATION_KEY).catch(() => null);
      if (!cancelled) {
        setLocation(parseStoredLocation(stored));
        setLoadingLocation(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistLocation = useCallback(async (next: BuyerLocation | null) => {
    setLocation(next);
    if (next) {
      await SecureStore.setItemAsync(LOCATION_KEY, JSON.stringify(next)).catch(() => {});
    } else {
      await SecureStore.deleteItemAsync(LOCATION_KEY).catch(() => {});
    }
  }, []);

  const setManualLocation = useCallback(
    async (city: string, state: string) => {
      const trimmedCity = city.trim();
      if (!trimmedCity) {
        throw new Error('City is required');
      }

      await persistLocation({
        city: trimmedCity,
        state: state.trim(),
        source: 'manual',
      });
    },
    [persistLocation],
  );

  const detectCurrentLocation = useCallback(async () => {
    setDetectingLocation(true);

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

      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const city = place?.city || place?.subregion || place?.district || '';
      const state = place?.region || '';

      if (!city) {
        throw new Error('Could not determine your city. Please choose it manually.');
      }

      const next: BuyerLocation = { city, state, source: 'gps' };
      await persistLocation(next);
      return next;
    } finally {
      setDetectingLocation(false);
    }
  }, [persistLocation]);

  const clearLocation = useCallback(async () => {
    await persistLocation(null);
  }, [persistLocation]);

  const value = useMemo(
    () => ({
      location,
      loadingLocation,
      detectingLocation,
      setManualLocation,
      detectCurrentLocation,
      clearLocation,
    }),
    [location, loadingLocation, detectingLocation, setManualLocation, detectCurrentLocation, clearLocation],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useBuyerLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useBuyerLocation must be used within LocationProvider');
  }
  return context;
}

