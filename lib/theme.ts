import type { WeatherTheme } from "./wmo";

export interface AuraPalette {
  wx1: string;
  wx2: string;
  wx3: string;
  accent: string;
}

// Each condition tints the interface with the sky it describes.
export const AURA: Record<WeatherTheme, AuraPalette> = {
  "clear-day": { wx1: "#0369a1", wx2: "#082f49", wx3: "#38bdf8", accent: "#fcd34d" },
  "clear-night": { wx1: "#1e1b4b", wx2: "#020617", wx3: "#4338ca", accent: "#a5b4fc" },
  "partly-day": { wx1: "#0e7490", wx2: "#0c1a2b", wx3: "#60a5fa", accent: "#93c5fd" },
  "partly-night": { wx1: "#1e293b", wx2: "#020617", wx3: "#4f46e5", accent: "#a5b4fc" },
  cloudy: { wx1: "#334155", wx2: "#0b1220", wx3: "#64748b", accent: "#cbd5e1" },
  fog: { wx1: "#475569", wx2: "#131c28", wx3: "#94a3b8", accent: "#e2e8f0" },
  drizzle: { wx1: "#155e75", wx2: "#0b1220", wx3: "#22d3ee", accent: "#67e8f9" },
  rain: { wx1: "#1e3a8a", wx2: "#060d16", wx3: "#3b82f6", accent: "#7dd3fc" },
  showers: { wx1: "#155e75", wx2: "#060d16", wx3: "#06b6d4", accent: "#67e8f9" },
  freezing: { wx1: "#0e7490", wx2: "#0b1a26", wx3: "#22d3ee", accent: "#a5f3fc" },
  snow: { wx1: "#0c4a6e", wx2: "#0f172a", wx3: "#7dd3fc", accent: "#e0f2fe" },
  thunder: { wx1: "#4c1d95", wx2: "#05060f", wx3: "#8b5cf6", accent: "#c4b5fd" },
};

export function auraFor(theme: WeatherTheme) {
  return AURA[theme] ?? AURA.cloudy;
}
