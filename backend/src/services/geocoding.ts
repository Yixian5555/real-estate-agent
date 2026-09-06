import { cityToRegion } from './zealty';

interface NominatimResponse {
  address: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
  };
  display_name: string;
}

export interface GeoLocation {
  city: string;
  neighborhood: string;
  zealtyRegion: string;
  displayAddress: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RealEstateScout/1.0 (personal project)' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

  const data = await res.json() as NominatimResponse;
  const city = data.address.city ?? data.address.town ?? data.address.village ?? 'Vancouver';
  const neighborhood =
    data.address.neighbourhood ??
    data.address.quarter ??
    data.address.suburb ??
    city;

  return {
    city,
    neighborhood,
    zealtyRegion: cityToRegion(city),
    displayAddress: data.display_name,
  };
}
