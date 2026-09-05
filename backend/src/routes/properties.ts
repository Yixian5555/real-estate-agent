import { Router } from 'express';
import { reverseGeocode } from '../services/geocoding';
import { searchListings, getMarketStats } from '../services/zealty';
import { filterAndSort } from '../services/filter';
import { narrateNearby } from '../services/narrator';
import type { PropertyFilters } from '../types';

const router = Router();

router.get('/nearby', async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: 'Valid lat and lon query params are required' });
    return;
  }

  const filters: PropertyFilters = {
    maxPrice:      req.query.maxPrice  ? Number(req.query.maxPrice)  : undefined,
    minPrice:      req.query.minPrice  ? Number(req.query.minPrice)  : undefined,
    minBeds:       req.query.minBeds   ? Number(req.query.minBeds)   : undefined,
    maxBeds:       req.query.maxBeds   ? Number(req.query.maxBeds)   : undefined,
    minBaths:      req.query.minBaths  ? Number(req.query.minBaths)  : undefined,
    maxBaths:      req.query.maxBaths  ? Number(req.query.maxBaths)  : undefined,
    propertyTypes: req.query.propertyTypes
      ? (req.query.propertyTypes as string).split(',')
      : undefined,
    radiusMetres:  req.query.radius ? Number(req.query.radius) : 500,
  };

  const preferences = (req.query.preferences as string) ?? '';

  try {
    // Step 1: Determine neighborhood and Zealty region from GPS
    const geo = await reverseGeocode(lat, lon);

    // Step 2: Fetch listings + market stats in parallel
    const [{ properties: raw }, marketStats] = await Promise.all([
      searchListings(geo.zealtyRegion),
      getMarketStats(geo.zealtyRegion),
    ]);

    // Step 3: Rule-based filter layer (no AI) + distance sort
    const nearby = filterAndSort(raw, lat, lon, filters);

    // Step 4: Claude narration layer
    const narration = await narrateNearby(nearby, marketStats, geo.neighborhood, preferences);

    res.json({
      properties: nearby,
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
