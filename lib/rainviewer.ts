import { REVALIDATE } from "./cache";
import type { RadarIndex } from "./types";

const INDEX_URL = "https://api.rainviewer.com/public/weather-maps.json";

interface RawFrame {
  time: number;
  path: string;
}

interface RawIndex {
  generated: number;
  host: string;
  radar?: { past?: RawFrame[]; nowcast?: RawFrame[] };
}

// `path` is an opaque hash — building a URL from `time` returns HTTP 410.
// Colour scheme 4 (Rainbow SELEX-IS) reads best over a dark basemap.
const tileTemplate = (host: string, path: string) =>
  `${host}${path}/512/{z}/{x}/{y}/4/1_1.png`;

export async function fetchRadarIndex(): Promise<RadarIndex> {
  const res = await fetch(INDEX_URL, { next: { revalidate: REVALIDATE.radar } });
  if (!res.ok) throw new Error(`RainViewer HTTP ${res.status}`);

  const data = (await res.json()) as RawIndex;
  const raw = [...(data.radar?.past ?? []), ...(data.radar?.nowcast ?? [])];

  return {
    generated: data.generated,
    frames: raw.map((f) => ({
      time: f.time,
      tileUrl: tileTemplate(data.host, f.path),
    })),
  };
}
