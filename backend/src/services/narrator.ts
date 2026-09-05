import type { Property, MarketStats } from '../types';

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)} million`;
  return `$${(price / 1_000).toFixed(0)} thousand`;
}

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
  soldProperties: Property[],
  marketStats: MarketStats | null,
  neighborhood: string,
  _userPreferences: string,
): string {
  if (properties.length === 0 && soldProperties.length === 0) {
    return `Nothing listed or recently sold near you in ${neighborhood} right now.`;
  }

  const parts: string[] = [];

  // Active listing lead
  if (properties.length > 0) {
    const top = properties[0];
    const proximity = describeProximity(top.distanceMetres ?? 0);
    parts.push(
      `${proximity} — ${top.streetAddress} — is a ${top.bedroomCount}-bed ${top.type} ` +
      `listed at ${formatPrice(top.listingPrice)}, ${top.houseSize.toLocaleString()} sqft.`
    );

    if (properties.length > 1) {
      const second = properties[1];
      parts.push(
        `Also nearby: ${second.streetAddress}, ${second.bedroomCount}-bed ${second.type} ` +
        `at ${formatPrice(second.listingPrice)}, ${Math.round(second.distanceMetres ?? 0)}m away.`
      );
    }
  } else {
    parts.push(`No active listings right near you in ${neighborhood}.`);
  }

  // Sold comps
  if (soldProperties.length > 0) {
    const soldPrices = soldProperties.map(p => p.listingPrice);
    const avgSold = soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length;
    const minSold = Math.min(...soldPrices);
    const maxSold = Math.max(...soldPrices);

    if (soldPrices.length === 1) {
      parts.push(
        `For reference: a similar property nearby sold recently for ${formatPrice(soldPrices[0])}.`
      );
    } else {
      parts.push(
        `For reference: ${soldPrices.length} nearby properties sold recently, ` +
        `ranging from ${formatPrice(minSold)} to ${formatPrice(maxSold)}, ` +
        `averaging ${formatPrice(Math.round(avgSold))}.`
      );
    }
  }

  // Market snapshot
  if (marketStats) {
    parts.push(
      `${neighborhood} market: ${marketStats.count.toLocaleString()} active listings, ` +
      `median ${formatPrice(marketStats.medianPrice)}, ${marketStats.medianDOM} days on market.`
    );
  }

  return parts.join(' ');
}
