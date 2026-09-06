export function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1_000).toFixed(0)}k`;
}

export function formatDistance(metres?: number): string {
  if (metres === undefined) return '';
  return metres < 1000 ? `${Math.round(metres)}m away` : `${(metres / 1000).toFixed(1)}km away`;
}
