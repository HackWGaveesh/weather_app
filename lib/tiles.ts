import type { StyleSpecification } from "maplibre-gl";

const GIBS_BASE = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";

export interface GibsLayer {
  id: string;
  label: string;
  layer: string;
  matrixSet: string;
  ext: "jpg" | "png";
  maxZoom: number;
  temporal: "date" | "none";
}

export const GIBS_LAYERS = {
  trueColor: {
    id: "trueColor",
    label: "True colour (VIIRS)",
    layer: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    matrixSet: "GoogleMapsCompatible_Level9",
    ext: "jpg",
    maxZoom: 9,
    temporal: "date",
  },
} as const satisfies Record<string, GibsLayer>;

// GIBS has no imagery for the current UTC day until well into it — asking for
// today returns an empty black tile rather than an error.
export function defaultImageryDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// WMTS orders the path as TileRow/TileCol — {y}/{x} — not the XYZ {x}/{y}
// convention every other source here uses.
export function gibsTileUrl(layer: GibsLayer, date: string) {
  const time = layer.temporal === "date" ? `${date}/` : "";
  return `${GIBS_BASE}/${layer.layer}/default/${time}${layer.matrixSet}/{z}/{y}/{x}.${layer.ext}`;
}

export const LAYER_IDS = {
  darkBase: "base-dark",
  imagery: "base-imagery",
  gibs: "gibs-truecolor",
  labels: "reference-labels",
} as const;

// An inline raster style rather than a hosted vector one: every tile source here
// is raster anyway, and this keeps the basemap on the same verified footing as
// the imagery and radar layers.
export const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    [LAYER_IDS.darkBase]: {
      type: "raster",
      tiles: [`${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 16,
    },
    [LAYER_IDS.imagery]: {
      type: "raster",
      tiles: [`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 19,
    },
    [LAYER_IDS.labels]: {
      type: "raster",
      tiles: [`${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 16,
    },
  },
  layers: [
    { id: "backdrop", type: "background", paint: { "background-color": "#060d16" } },
    {
      id: LAYER_IDS.darkBase,
      type: "raster",
      source: LAYER_IDS.darkBase,
      paint: { "raster-opacity": 1 },
    },
    {
      id: LAYER_IDS.imagery,
      type: "raster",
      source: LAYER_IDS.imagery,
      layout: { visibility: "none" },
      paint: { "raster-opacity": 1 },
    },
  ],
};

// Labels are added last so place names stay readable above imagery and radar.
export const LABELS_LAYER = {
  id: LAYER_IDS.labels,
  type: "raster" as const,
  source: LAYER_IDS.labels,
  paint: { "raster-opacity": 0.9 },
};

export const ATTRIBUTION = {
  weather: "Weather from Open-Meteo",
  radar: "Radar from RainViewer",
  satellite: "Imagery from NASA GIBS and Esri",
};
