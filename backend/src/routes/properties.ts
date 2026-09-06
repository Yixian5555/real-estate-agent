import { Router } from 'express';
import { reverseGeocode } from '../services/geocoding';
import { searchListings, searchSoldListings, getMarketStats } from '../services/zealty';
import { filterAndSort } from '../services/filter';
import { narrateNearby } from '../services/narrator';
import type { PropertyFilters } from '../types';

const router = Router();

const toNum = (v: unknown): number | undefined => {
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

router.get('/nearby', async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: 'Valid lat and lon query params are required' });
    return;
  }

  const filters: PropertyFilters = {
    maxPrice:      toNum(req.query.maxPrice),
    minPrice:      toNum(req.query.minPrice),
    minBeds:       toNum(req.query.minBeds),
    maxBeds:       toNum(req.query.maxBeds),
    minBaths:      toNum(req.query.minBaths),
    maxBaths:      toNum(req.query.maxBaths),
    propertyTypes: req.query.propertyTypes
      ? (req.query.propertyTypes as string).split(',')
      : undefined,
    radiusMetres:  toNum(req.query.radius) ?? 500,
  };

  const preferences = (req.query.preferences as string) ?? '';

  try {
    // Step 1: Determine neighborhood and Zealty region from GPS
    const geo = await reverseGeocode(lat, lon);

    // Step 2: Fetch active listings + sold listings + market stats in parallel
    const [{ properties: raw }, soldRaw, marketStats] = await Promise.all([
      searchListings(geo.zealtyRegion, geo.neighborhood),
      searchSoldListings(geo.zealtyRegion, geo.neighborhood),
      getMarketStats(geo.zealtyRegion),
    ]);

    // Step 3: Rule-based filter + distance sort for both active and sold
    const nearby = filterAndSort(raw, lat, lon, filters);
    const nearbySold = filterAndSort(soldRaw, lat, lon, { ...filters, radiusMetres: Math.max(filters.radiusMetres, 500) });

    // Step 4: Template narration (no AI)
    const narration = narrateNearby(nearby, nearbySold, marketStats, geo.neighborhood, preferences);

    res.json({
      properties: nearby,
      soldProperties: nearbySold,
      marketStats,
      narration,
      neighborhood: geo.neighborhood,
      region: geo.zealtyRegion,
    });
  } catch (err) {
    console.error('[/api/nearby]', err);
    res.status(500).json({ error: 'Failed to fetch nearby properties' });
  }
});

export default router;
