export interface Property {
  streetAddress: string;
  city: string;
  areaName: string;
  province: string;
  postalCode: string;
  listingPrice: number;
  bedroomCount: number;
  bathroomCount: number;
  houseSize: number;
  type: string;
  url: string;
  latitude: number;
  longitude: number;
  listingBrokerage: string;
  images: string[];
  sortLabel: string;
  distanceMetres?: number;
}

export interface MarketStats {
  count: number;
  medianPrice: number;
  medianPriceSqFt: number;
  medianDOM: number;
}

// Rule-based filters — no AI involved, deterministic
export interface PropertyFilters {
  maxPrice?: number;
  minPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  propertyTypes?: string[]; // 'APT' | 'HSE' | 'TWN' | 'MUF' | 'PAD' | 'LND'
  radiusMetres: number;
}

export interface NearbyResponse {
  properties: Property[];
  marketStats: MarketStats | null;
  narration: string;
  neighborhood: string;
  region: string;
}
