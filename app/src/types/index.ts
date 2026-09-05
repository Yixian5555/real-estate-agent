export interface Property {
  streetAddress: string;
  city: string;
  areaName: string;
  listingPrice: number;
  bedroomCount: number;
  bathroomCount: number;
  houseSize: number;
  type: string;
  url: string;
  latitude: number;
  longitude: number;
  images: string[];
  distanceMetres?: number;
}

export interface MarketStats {
  count: number;
  medianPrice: number;
  medianPriceSqFt: number;
  medianDOM: number;
}

// Rule-based filters set by the user in Settings — no AI involved
export interface PropertyFilters {
  maxPrice?: number;
  minPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  propertyTypes?: string[];
  radiusMetres: number;
}

export interface NearbyResponse {
  properties: Property[];
  marketStats: MarketStats | null;
  narration: string;
  neighborhood: string;
  region: string;
}
