"use client";

import dynamic from "next/dynamic";

// MapLibre touches `window` at import, and `ssr: false` is only permitted from a
// client component — hence this wrapper.
const WorldMap = dynamic(() => import("./WorldMap"), {
  ssr: false,
  loading: () => <div className="size-full bg-[var(--ink-800)]" aria-hidden />,
});

export type { MapLayerState } from "./WorldMap";
export default WorldMap;
