import { useState, useCallback } from 'react';
import { fetchNearby } from '../services/api';
import type { NearbyResponse, PropertyFilters } from '../types';

const DEFAULT_FILTERS: PropertyFilters = { radiusMetres: 500 };

export function useNearbyProperties() {
  const [data, setData] = useState<NearbyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    lat: number,
    lon: number,
    filters: PropertyFilters = DEFAULT_FILTERS,
    preferences = '',
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNearby(lat, lon, filters, preferences);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, search };
}
