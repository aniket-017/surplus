import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/src/context/AuthContext';
import { getMyServices } from '@/src/lib/servicesApi';
import type { SellerServiceStats, Service } from '@/src/types/service';

const EMPTY_STATS: SellerServiceStats = {
  activeServices: 0,
  totalViews: 0,
  totalInquiries: 0,
};

export function useMyServices() {
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<SellerServiceStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const loadServices = useCallback(async () => {
    if (!token) {
      setServices([]);
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }

    try {
      const data = await getMyServices(token);
      setServices(data.services);
      setStats(data.stats ?? EMPTY_STATS);
    } catch {
      setServices([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices]),
  );

  return { services, stats, loading, reload: loadServices };
}
