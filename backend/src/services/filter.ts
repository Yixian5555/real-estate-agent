import type { Property, PropertyFilters } from '../types';

function haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function applyPropertyFilters(p: Property & { distanceMetres: number }, filters: PropertyFilters): boolean {
  if (filters.maxPrice !== undefined && p.listingPrice > filters.maxPrice) return false;
  if (filters.minPrice !== undefined && p.listingPrice < filters.minPrice) return false;
  if (filters.minBeds !== undefined && p.bedroomCount < filters.minBeds) return false;
  if (filters.maxBeds !== undefined && p.bedroomCount > filters.maxBeds) return false;
  if (filters.minBaths !== undefined && p.bathroomCount < filters.minBaths) return false;
  if (filters.maxBaths !== undefined && p.bathroomCount > filters.maxBaths) return false;
  if (filters.propertyTypes?.length && !filters.propertyTypes.includes(p.type)) return false;
  return true;
}

// Cascading radius: tighten to the smallest ring that yields results.
// Rings: 50m (this building) → 150m (this block) → 500m (street) → user's max radius
// This way the narration says "this building" not "500m away" when you're standing right in front.
const RADIUS_CASCADE = [50, 150, 500];

export function filterAndSort(
  properties: Property[],
  userLat: number,
  userLon: number,
  filters: PropertyFilters,
): Property[] {
  const withDistance = properties.map(p => ({
    ...p,
    distanceMetres: haversineMetres(userLat, userLon, p.latitude, p.longitude),
  }));

  const maxRadius = filters.radiusMetres;
  const radii = [...RADIUS_CASCADE.filter(r => r <= maxRadius), maxRadius];
  // Deduplicate radii
  const rings = [...new Set(radii)];

  for (const radius of rings) {
    const candidates = withDistance
      .filter(p => p.distanceMetres <= radius && applyPropertyFilters(p, filters))
      .sort((a, b) => a.distanceMetres - b.distanceMetres)
      .slice(0, 5);

    if (candidates.length > 0) return candidates;
  }

  return [];
}
