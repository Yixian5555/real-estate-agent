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

// Pure rule-based filtering + distance sort — no AI involved
export function filterAndSort(
  properties: Property[],
  userLat: number,
  userLon: number,
  filters: PropertyFilters,
): Property[] {
  return properties
    .map(p => ({
      ...p,
      distanceMetres: haversineMetres(userLat, userLon, p.latitude, p.longitude),
    }))
    .filter(p => {
      if (p.distanceMetres > filters.radiusMetres) return false;
      if (filters.maxPrice !== undefined && p.listingPrice > filters.maxPrice) return false;
      if (filters.minPrice !== undefined && p.listingPrice < filters.minPrice) return false;
      if (filters.minBeds !== undefined && p.bedroomCount < filters.minBeds) return false;
      if (filters.maxBeds !== undefined && p.bedroomCount > filters.maxBeds) return false;
      if (filters.minBaths !== undefined && p.bathroomCount < filters.minBaths) return false;
      if (filters.maxBaths !== undefined && p.bathroomCount > filters.maxBaths) return false;
      if (filters.propertyTypes?.length && !filters.propertyTypes.includes(p.type)) return false;
      return true;
    })
    .sort((a, b) => a.distanceMetres - b.distanceMetres)
    .slice(0, 5);
}
