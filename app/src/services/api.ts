import type { NearbyResponse, PropertyFilters } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchNearby(
  lat: number,
  lon: number,
  filters: PropertyFilters,
  preferences: string,
): Promise<NearbyResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    radius: filters.radiusMetres.toString(),
    preferences,
  });

  if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
  if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
  if (filters.minBeds !== undefined) params.set('minBeds', filters.minBeds.toString());
  if (filters.maxBeds !== undefined) params.set('maxBeds', filters.maxBeds.toString());
  if (filters.minBaths !== undefined) params.set('minBaths', filters.minBaths.toString());
  if (filters.maxBaths !== undefined) params.set('maxBaths', filters.maxBaths.toString());
  if (filters.propertyTypes?.length) params.set('propertyTypes', filters.propertyTypes.join(','));

  const res = await fetch(`${API_URL}/api/nearby?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<NearbyResponse>;
}
