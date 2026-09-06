# Real Estate Scout — Build Report

**Repo:** https://github.com/Yixian5555/real-estate-agent  
**Stack:** React Native + Expo (Android-first) / Node.js + TypeScript backend  
**Current cost:** $0/month (no paid APIs active)

---

## What This App Does

A personal real estate scout for walking around Vancouver. You tap "Scan Nearby", the app reads your GPS coordinates, fetches nearby active listings and recently sold properties from MLS data, and reads a spoken summary aloud — "This building right here — 2256 E Pender Street — is a 3-bed Half Duplex listed at $1.96 million…"

---

## Architecture

```
[Android App — Expo]
        |
        | HTTP GET /api/nearby?lat=&lon=&radius=&filters...
        v
[Node.js Backend — Express + TypeScript]
        |
        |── Nominatim API (free)         reverse geocode GPS → address + neighbourhood
        |── Zealty MCP (free)            fetch active MLS listings for region
        |── Zealty MCP (auth required)   fetch recently sold listings
        |── filter.ts (local)            haversine distance filter + rule-based filters
        └── narrator.ts (local)          template-based narration string (no AI currently)
        |
        v
[Response JSON]
  properties[]      active listings sorted by distance
  soldProperties[]  recently sold, last 180 days (empty if no ZEALTY_TOKEN)
  marketStats       median price, days on market, active count
  narration         spoken summary string
  neighborhood      detected neighbourhood name
```

**App renders:**
- Spoken narration via `expo-speech` (device TTS, free)
- "For Sale Nearby" card list
- "Recently Sold Nearby" card list (greyed, SOLD badge)
- Filters persist via `AsyncStorage`

---

## File Structure

```
real-estate-agent/
├── backend/
│   ├── src/
│   │   ├── index.ts                Express server, port 3000
│   │   ├── routes/
│   │   │   └── properties.ts       GET /api/nearby
│   │   ├── services/
│   │   │   ├── zealty.ts           Zealty MCP client (search_listings, get_market_stats, searchSoldListings)
│   │   │   ├── geocoding.ts        Nominatim reverse geocode → city + neighbourhood + Zealty region code
│   │   │   ├── filter.ts           Haversine distance + cascading radius + rule-based property filters
│   │   │   └── narrator.ts         Template narration (proximity-aware language, sold comps summary)
│   │   └── types/index.ts          Shared TypeScript types
│   ├── .env.example                ZEALTY_TOKEN (optional), PORT
│   └── package.json                express, cors, dotenv, tsx
└── app/
    ├── App.tsx                     Bottom tab navigation, AsyncStorage for persisted filters
    └── src/
        ├── screens/
        │   ├── HomeScreen.tsx      GPS scan, narration card, active + sold property lists
        │   └── SettingsScreen.tsx  Price range, beds, radius, property type chips, narration preferences
        ├── components/
        │   └── PropertyCard.tsx    Listing card with image, price, distance badge, sold styling
        ├── hooks/
        │   ├── useLocation.ts      expo-location, Accuracy.High, 20m update interval
        │   └── useNearbyProperties.ts  fetch wrapper with loading/error state
        ├── services/
        │   └── api.ts              fetchNearby() — builds query params, calls backend
        └── types/index.ts          Mirrors backend types
```

---

## Key Technical Decisions

### Zealty MCP as the Data Source
Zealty (zealty.ca) operates a licensed BC brokerage (Holywell Properties) with access to Greater Vancouver REALTORS® MLS data. They expose this via an official MCP (Model Context Protocol) server at `https://www.zealty.ca/api/mcp`. This is the cleanest legal path to real BC MLS data for a personal app — no scraping, no brokerage license required.

**Protocol:** JSON-RPC 2.0 over HTTP POST  
**Required headers:** `Content-Type: application/json`, `Accept: application/json, text/event-stream`  
**Auth:** Active listings are fully public. Sold/expired require a free Zealty account token passed as `Authorization: Bearer <token>`

### The 50-Listing Cap Problem (and fix)
Zealty's MCP caps `search_listings` at `limit: 50` per call. With 4,188 active listings spread across Vancouver, fetching 50 newest listings gives almost zero chance of any being within walking distance of a given GPS point.

**Fix:** Two parallel searches — one region-wide, one filtered by neighbourhood — deduped and merged into ~100 candidates for our distance filter to work on. This gets enough local coverage without exceeding the cap.

### Cascading Radius
Rather than a fixed radius that either misses nearby listings or returns distant ones, the filter tries progressively wider rings:
- **50m** → "This building right here"
- **150m** → "Just X metres away on this block"
- **500m** → "X metres away on this street"
- **User's max** → neighbourhood scale

Returns results from the tightest ring that has any matches, so narration language is always calibrated to actual proximity.

### Nominatim for Geocoding (not Google)
Nominatim (OpenStreetMap) is free with no API key. It provides city + neighbourhood names which are mapped to Zealty region codes via a hardcoded lookup table in `zealty.ts`. Google Maps Geocoding is a natural upgrade when more precise neighbourhood detection is needed.

### No AI Narration (currently)
The narrator is a pure TypeScript template function — proximity-aware language, sold price range calculation, market snapshot. Zero API cost. The architecture is designed to swap in Claude Haiku narration with one function change when the user is ready (~$2–5/month at personal use volume).

### GPS Accuracy
`expo-location` configured at `Accuracy.High` with a 20-metre update interval. Expected real-world accuracy: 3–10m in open areas, 10–20m in dense downtown blocks. Sufficient to determine which side of a street you're on.

---

## Data Flow — Single Request

```
1. App sends:  GET /api/nearby?lat=49.2799&lon=-123.0585&radius=500&maxPrice=1500000
2. Backend:
   a. reverseGeocode(49.2799, -123.0585)
      → Nominatim → { city: "Vancouver", neighbourhood: "Grandview-Woodland",
                      zealtyRegion: "vancouver-city" }
   b. parallel:
      - searchListings("vancouver-city", "Grandview-Woodland")
        → 2x Zealty MCP calls (region + neighbourhood), merged, ~100 results
      - searchSoldListings("vancouver-city", "Grandview-Woodland", daysBack=180)
        → 2x Zealty MCP calls with auth token (skipped if no ZEALTY_TOKEN)
      - getMarketStats("vancouver-city")
        → 1x Zealty MCP call
   c. filterAndSort(raw, 49.2799, -123.0585, filters)
      → cascading radius → top 5 active within tightest ring
      → same for sold with min 500m radius
   d. narrateNearby(nearby, nearbySold, marketStats, "Grandview-Woodland", preferences)
      → template string
3. Response JSON → app speaks narration via expo-speech
```

---

## Tested Endpoints

```bash
# Health
GET /api/health
→ { status: "ok", ts: "..." }

# Active listings near a known listing (Hastings area)
GET /api/nearby?lat=49.2799&lon=-123.0585&radius=2000
→ 5 properties, narration, market stats

# Exact building match (50m ring triggers "This building right here")
GET /api/nearby?lat=49.27992&lon=-123.05848&radius=50
→ narration: "This building right here — #2 2256 E Pender Street..."

# With filters
GET /api/nearby?lat=49.2799&lon=-123.0585&radius=2000&maxPrice=1000000&minBeds=2
```

**Not yet tested on device:** The Expo app has been scaffolded but not yet run on a physical Android phone.

---

## Limitations and Known Issues

| Issue | Detail | Fix |
|---|---|---|
| Zealty 50-listing cap | Only 100 candidates per search (2 merged calls). Sparse areas may return 0 results even within a large radius | Use multiple neighbourhood searches or accept the limitation |
| Zealty neighbourhood tags | Zealty's neighbourhood filter does not reliably match geographic coordinates — a "Kitsilano"-tagged listing may have coordinates in Hastings. Workaround: dual search without relying on neighbourhood for geographic accuracy | Better fix would be multiple adjacent neighbourhood searches |
| Non-listed buildings | If a building isn't currently listed or recently sold, the app has no data for it. Zealty is listing-only | Add BC Assessment data for full coverage |
| Sold listings gated | `soldProperties[]` is always empty until `ZEALTY_TOKEN` is set in `.env` | User needs to manually extract token from zealty.ca browser session |
| App not phone-tested | HomeScreen, SettingsScreen, PropertyCard are built but untested on a real Android device | Run `npx expo start --android` with Expo Go |
| TTS language | `expo-speech` with `language: 'en-CA'` — voice quality is device-dependent | Upgrade to ElevenLabs or OpenAI TTS for consistent quality |

---

## APIs in Use

| API | Purpose | Auth | Cost |
|---|---|---|---|
| Zealty MCP `https://www.zealty.ca/api/mcp` | Active listings, sold listings, market stats | Free account for sold | Free |
| Nominatim `https://nominatim.openstreetmap.org/reverse` | Reverse geocoding | None | Free |
| expo-speech | Text-to-speech | None (device-native) | Free |

---

## APIs Not Yet Integrated (Planned)

| API | Purpose | Cost |
|---|---|---|
| Claude Haiku (`claude-haiku-4-5-20251001`) | Natural language narration replacing template | ~$2–5/mo |
| CMHC Open Data | Rental market averages by neighbourhood | Free |
| Walk Score API | Walkability/transit scores | Free tier |
| BC Assessment | Every BC property, not just listed ones | Free data, no official API |
| ElevenLabs / OpenAI TTS | Better voice quality | $5–22/mo |

---

## Environment Variables

**backend/.env**
```
PORT=3000
ZEALTY_TOKEN=          # optional — free Zealty account token for sold listings
```

**app/.env**
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000   # your PC's local IP for device testing
```

---

## How to Run

```bash
# Backend
cd backend
cp .env.example .env    # add ZEALTY_TOKEN if you have one
npm install
npm run dev             # runs on localhost:3000, hot-reloads

# App (requires Expo Go on Android)
cd app
cp .env.example .env    # set EXPO_PUBLIC_API_URL to your PC's local IP
npm install
npx expo start --android
```

---

## Git History

| Commit | Summary |
|---|---|
| `f90888a` | Initial scaffold — backend + app structure |
| `a76a8ac` | Fix Zealty 50-listing cap + remove AI narration |
| `9c8691a` | Improve GPS accuracy + cascading proximity radius |
| `ada15ef` | Add recently sold listings as reference data |
