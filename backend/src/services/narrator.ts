import type { Property, MarketStats } from '../types';

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)} million`;
  return `$${(price / 1_000).toFixed(0)} thousand`;
}

function formatDistance(metres: number): string {
  return metres < 1000 ? `${Math.round(metres)} metres away` : `${(metres / 1000).toFixed(1)} kilometres away`;
}

// Template-based narration — no AI, no cost
export function narrateNearby(
  properties: Property[],
  marketStats: MarketStats | null,
  neighborhood: string,
  _userPreferences: string,
): string {
  if (properties.length === 0) {
    return `Nothing active on the market within your search radius in ${neighborhood} right now.`;
  }

  const top = properties[0];
  const dist = top.distanceMetres !== undefined ? `, ${formatDistance(top.distanceMetres)}` : '';
  const count = properties.length;

  let narration =
    `${count} listing${count > 1 ? 's' : ''} near you in ${neighborhood}. ` +
    `The closest is a ${top.bedroomCount}-bedroom ${top.type} at ${top.streetAddress}${dist}, ` +
    `listed at ${formatPrice(top.listingPrice)} with ${top.bathroomCount} bathroom${top.bathroomCount !== 1 ? 's' : ''} and ${top.houseSize.toLocaleString()} square feet.`;

  if (marketStats) {
    narration += ` The ${neighborhood} market has ${marketStats.count.toLocaleString()} active listings, ` +
      `with a median price of ${formatPrice(marketStats.medianPrice)} and an average of ${marketStats.medianDOM} days on market.`;
  }

  return narration;
}
