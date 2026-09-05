import type { Property, MarketStats } from '../types';

const ZEALTY_MCP = 'https://www.zealty.ca/api/mcp';
const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/event-stream',
};

// Maps city names (from reverse geocoding) to Zealty region codes
export const CITY_TO_REGION: Record<string, string> = {
  'Vancouver': 'vancouver-city',
  'Burnaby': 'mapby',
  'North Vancouver': 'mapnv',
  'West Vancouver': 'mapwv',
  'Richmond': 'mapri',
  'New Westminster': 'mapnw',
  'Coquitlam': 'coquitlam',
  'Port Moody': 'mappm',
  'Port Coquitlam': 'port-coquitlam',
  'Surrey': 'surrey-city',
  'White Rock': 'white-rock',
  'Langley': 'langley',
  'Delta': 'delta',
  'Maple Ridge': 'maple-ridge',
  'Pitt Meadows': 'pitt-meadows',
  'Squamish': 'squamish',
  'Whistler': 'whistler',
};

interface MCPResponse {
  result?: {
    structuredContent?: {
      result?: { total: number; properties: Property[] };
      activeSnapshot?: MarketStats;
    };
  };
  error?: { message: string };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<MCPResponse['result']> {
  const res = await fetch(ZEALTY_MCP, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
  const json = await res.json() as MCPResponse;
  if (json.error) throw new Error(`Zealty MCP: ${json.error.message}`);
  return json.result;
}

export function cityToRegion(city: string): string {
  return CITY_TO_REGION[city] ?? 'vancouver-city';
}

// Zealty caps at 50 results per call. We run two searches (neighborhood + region-wide)
// and merge them so our distance filter has ~100 candidates to work with.
export async function searchListings(
  region: string,
  neighborhood?: string,
): Promise<{ total: number; properties: Property[] }> {
  const base = { cityOrRegion: region, status: 'active', limit: 50 };

  const calls = [callTool('search_listings', base)];
  if (neighborhood) calls.push(callTool('search_listings', { ...base, neighborhood }));

  const results = await Promise.all(calls);

  const seen = new Set<string>();
  const properties: Property[] = [];
  let total = 0;

  for (const r of results) {
    const batch = r?.structuredContent?.result;
    if (!batch) continue;
    total = Math.max(total, batch.total);
    for (const p of batch.properties) {
      const key = p.url;
      if (!seen.has(key)) { seen.add(key); properties.push(p); }
    }
  }

  return { total, properties };
}

export async function getMarketStats(region: string): Promise<MarketStats | null> {
  try {
    const result = await callTool('get_market_stats', { region });
    return result?.structuredContent?.activeSnapshot ?? null;
  } catch {
    return null;
  }
}
