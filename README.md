# Weather Observatory

Live weather for any point on Earth — click anywhere on the map, or search a city — with NASA satellite
imagery and animated rain radar layered over it.

Built with Next.js (App Router), TypeScript, Tailwind and MapLibre GL. Every data source is free and
key-less, so there is nothing to sign up for and no secret to rotate before a demo.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## What it does

- **Anywhere on Earth.** Click the ocean, Antarctica, the Sahara — a forecast comes back for every
  coordinate. Where a place has no name, the app falls back from city to region to plain coordinates
  rather than showing an error.
- **Search that disambiguates.** Typing "Springfield" lists each one with its state and country, sorted by
  population.
- **Satellite and radar.** A dark canvas basemap, an Esri satellite base, NASA VIIRS true-colour imagery,
  and RainViewer rain radar with a two-hour animated timeline.
- **The interface takes its colour from the conditions.** Clear, cloudy, rain, snow and storm each retint
  the whole view, with separate day and night palettes — jumping from Reykjavík to Dubai visibly warms the
  UI.
- **Shareable links.** The selected location lives in the URL, so any view can be sent to someone else and
  renders server-side on arrival.
- **°C / °F** converts everything client-side, with no extra network request.

## Suggested demo path

The preset chips are chosen as climate extremes, so there is no need to invent a city on the spot:

1. Open on **Tokyo**, then hit **Dubai** — watch the temperature count up and the interface turn amber.
2. Hit **Reykjavík** or **Nuuk** for the opposite end.
3. Turn on **Satellite base**, then **True colour** — real NASA imagery from yesterday, clouds and all.
4. Turn on **Rain radar** over somewhere currently wet and press play.
5. Click a random point in the middle of the Pacific to show it works with no named place at all.

## Data sources

| Layer | Source |
| --- | --- |
| Forecast, hourly, daily | [Open-Meteo](https://open-meteo.com) |
| Place search | Open-Meteo Geocoding |
| Air quality | Open-Meteo Air Quality |
| Reverse geocoding (map clicks) | BigDataCloud, with Nominatim as a fallback |
| Rain radar | [RainViewer](https://www.rainviewer.com) |
| True-colour satellite | [NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/) (VIIRS SNPP Corrected Reflectance) |
| Basemap and satellite base | Esri ArcGIS Online |

Attribution for these appears in the app itself.

### Licensing note worth raising early

Open-Meteo's free tier is **non-commercial use only** and rate-limited (roughly 10,000 calls/day).
Commercial deployment needs their paid API, which is a drop-in change of base URL plus a key — but it is
worth flagging to stakeholders before anyone assumes this is production-ready as-is. Esri's key-less tile
endpoint is likewise scoped to ArcGIS usage in their terms; NASA GIBS is the licence-clean satellite
option and works without it.

## Notes on a few non-obvious details

- Weather data is cached server-side per rounded coordinate, so repeated clicks in the same area do not
  each hit the upstream API.
- GIBS is asked for **yesterday's** imagery: the current UTC day returns empty black tiles until well into
  it.
- GIBS tiles are addressed `{z}/{y}/{x}` (WMTS row/column), unlike every other source here.
- RainViewer frame paths are opaque hashes; building a URL from the timestamp returns HTTP 410.
- Longitudes are normalised before use — panning across the antimeridian otherwise sends values beyond
  ±180, which the forecast API rejects.
