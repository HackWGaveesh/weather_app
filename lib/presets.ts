import type { PlaceRef } from "./types";

// Deliberate climate extremes — these double as the demo script, so nothing has
// to be invented under pressure in front of an audience.
export const PRESETS: PlaceRef[] = [
  { lat: 35.6895, lon: 139.6917, name: "Tokyo", country: "Japan", source: "preset" },
  { lat: 64.1355, lon: -21.8954, name: "Reykjavík", country: "Iceland", source: "preset" },
  { lat: 25.2048, lon: 55.2708, name: "Dubai", country: "United Arab Emirates", source: "preset" },
  { lat: 1.3521, lon: 103.8198, name: "Singapore", country: "Singapore", source: "preset" },
  { lat: 64.1836, lon: -51.7214, name: "Nuuk", country: "Greenland", source: "preset" },
  { lat: -54.8019, lon: -68.303, name: "Ushuaia", country: "Argentina", source: "preset" },
];

export const DEFAULT_PLACE: PlaceRef = PRESETS[0];
