import type { Property, MarketStats } from '../types';

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)} million`;
  return `$${(price / 1_000).toFixed(0)} thousand`;
}

// Converts raw metres into a natural spoken phrase based on proximity ring
function describeProximity(metres: number): string {
  if (metres <= 50)  return 'This building right here';
  if (metres <= 150) return `Just ${Math.round(metres)} metres away on this block`;
  if (metres <= 500) return `${Math.round(metres)} metres away on this street`;
  if (metres < 1000) return `${Math.round(metres)} metres from you`;
  return `${(metres / 1000).toFixed(1)} kilometres away`;
}

// Template-based narration — no AI, no cost
export function narrateNearby(
  properties: Property[],
  marketStats: MarketStats | null,
  neighborhood: string,
  _userPreferences: string,
): string {
  if (properties.length === 0) {
    return `Nothing active on the market near you in ${neighborhood} right now.`;
  }

  const top = properties[0];
  const dist = top.distanceMetres ?? 0;
  const proximity = describeProximity(dist);
  const count = properties.length;

  let narration =
    `${proximity} — ${top.streetAddress} — is a ${top.bedroomCount}-bedroom ${top.type} ` +
    `listed at ${formatPrice(top.listingPrice)}, ` +
    `${top.houseSize.toLocaleString()} square feet, ${top.bathroomCount} bath.`;

  if (count > 1) {
    const second = properties[1];
    narration += ` There's also a ${second.bedroomCount}-bed ${second.type} at ${second.streetAddress}, ` +
      `${formatPrice(second.listingPrice)}, ${Math.round(second.distanceMetres ?? 0)} metres away.`;
  }

  if (marketStats) {
    narration += ` ${neighborhood} market: ${marketStats.count.toLocaleString()} active listings, ` +
      `median ${formatPrice(marketStats.medianPrice)}, ${marketStats.medianDOM} days on market.`;
  }

  return narration;
}
