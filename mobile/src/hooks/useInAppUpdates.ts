import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

type InAppUpdatesModule = typeof import('expo-in-app-updates');

let cachedModule: InAppUpdatesModule | null | undefined;

function canUsePlayUpdates() {
  return Platform.OS === 'android' && !__DEV__;
}

async function loadUpdatesModule(): Promise<InAppUpdatesModule | null> {
  if (cachedModule !== undefined) return cachedModule;
  if (!canUsePlayUpdates()) {
    cachedModule = null;
    return null;
  }

  try {
    cachedModule = await import('expo-in-app-updates');
    return cachedModule;
  } catch {
    cachedModule = null;
    return null;
  }
}

export function useInAppUpdates() {
  const [required, setRequired] = useState(false);
  const [starting, setStarting] = useState(false);
  const requiredRef = useRef(false);
  const useImmediateRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    requiredRef.current = required;
  }, [required]);

  const startPlayUpdate = useCallback(async () => {
    const module = await loadUpdatesModule();
    if (!module) return false;

    setStarting(true);
    try {
      const started = await module.startUpdate(useImmediateRef.current);
      if (!started) setRequired(true);
      return started;
    } catch {
      setRequired(true);
      return false;
    } finally {
      setStarting(false);
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!canUsePlayUpdates() || inFlightRef.current) return;

    const module = await loadUpdatesModule();
    if (!module) return;

    inFlightRef.current = true;
    try {
      const info = await module.checkForUpdate();
      if (!info.updateAvailable) return;

      useImmediateRef.current = info.immediateAllowed !== false;
      if (!useImmediateRef.current) setRequired(true);
      await startPlayUpdate();
    } catch {
      // Play In-App Updates only work for Play-installed builds.
    } finally {
      inFlightRef.current = false;
    }
  }, [startPlayUpdate]);

  useEffect(() => {
    if (!canUsePlayUpdates()) return;

    let cancelled = false;
    let removeCancelled: (() => void) | undefined;

    void (async () => {
      const module = await loadUpdatesModule();
      if (!module || cancelled) return;

      removeCancelled = module.addUpdateListener('updateCancelled', () => {
        setRequired(true);
      });

      await checkForUpdates();
    })();

    const onAppState = (status: AppStateStatus) => {
      if (status !== 'active') return;
      if (requiredRef.current) {
        void startPlayUpdate();
        return;
      }
      void checkForUpdates();
    };

    const appStateSub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      removeCancelled?.();
      appStateSub.remove();
    };
  }, [checkForUpdates, startPlayUpdate]);

  return { required, starting, onUpdateNow: startPlayUpdate };
}
