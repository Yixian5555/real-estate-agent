import Anthropic from '@anthropic-ai/sdk';
import type { Property, MarketStats } from '../types';

const client = new Anthropic();

function buildSystemPrompt(userPreferences: string): string {
  return `You are a personal real estate scout narrating property info to someone walking through Vancouver.

Speak conversationally — like a knowledgeable friend talking in their ear. No bullet points, no markdown, no lists. Maximum 3 sentences.

The user cares about: ${userPreferences || 'value, investment potential, livability'}

Rules:
- Lead with the most surprising or relevant fact
- Mention market context briefly if noteworthy (hot market, long DOM, etc.)
- Flag anything unusual: unusually cheap, just listed, very high strata fee, etc.
- Use natural language: "just listed today", "been sitting for weeks", "surprisingly affordable for this block"
- Round prices naturally: "around $800k", "just under a million", "close to two million"
- Never mention data sources, APIs, tool names, or MLS`;
}

function summariseListing(p: Property): string {
  const dist = p.distanceMetres !== undefined ? `${Math.round(p.distanceMetres)}m away` : '';
  const price = `$${(p.listingPrice / 1000).toFixed(0)}k`;
  return `${p.streetAddress}${dist ? ` (${dist})` : ''}: ${p.type}, ${price}, ${p.bedroomCount}bd/${p.bathroomCount}ba, ${p.houseSize.toLocaleString()}sqft`;
}

export async function narrateNearby(
  properties: Property[],
  marketStats: MarketStats | null,
  neighborhood: string,
  userPreferences: string,
): Promise<string> {
  if (properties.length === 0) {
    return `Nothing active on the market within your search radius in ${neighborhood} right now.`;
  }

  const listingLines = properties.slice(0, 3).map(summariseListing).join('\n');
  const marketLine = marketStats
    ? `Market: ${marketStats.count} active listings, median $${(marketStats.medianPrice / 1000).toFixed(0)}k, ${marketStats.medianDOM} days on market`
    : '';

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 220,
    system: buildSystemPrompt(userPreferences),
    messages: [{
      role: 'user',
      content: `Neighborhood: ${neighborhood}\n${marketLine}\n\nNearest listings:\n${listingLines}\n\nNarrate this for someone walking past right now.`,
    }],
  });

  const block = message.content[0];
  return block.type === 'text' ? block.text : 'No narration available.';
}
