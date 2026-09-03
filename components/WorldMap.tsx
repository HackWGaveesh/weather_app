"use client";

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type MapMouseEvent,
} from "maplibre-gl";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PlaceRef, RadarFrame } from "@/lib/types";
import {
  GIBS_LAYERS,
  LABELS_LAYER,
  LAYER_IDS,
  MAP_STYLE,
  defaultImageryDate,
  gibsTileUrl,
} from "@/lib/tiles";

export interface MapLayerState {
  satellite: boolean;
  clouds: boolean;
  radar: boolean;
}

const radarLayerId = (i: number) => `radar-${i}`;

export default function WorldMap({
  selected,
  onPick,
  layers,
  radarFrames,
  frameIndex,
}: {
  selected: PlaceRef;
  onPick: (lat: number, lon: number) => void;
  layers: MapLayerState;
  radarFrames: RadarFrame[];
  frameIndex: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [selected.lon, selected.lat],
      zoom: 3.4,
      attributionControl: false,
      dragRotate: false,
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");

    const el = document.createElement("div");
    el.className = "relative size-3";
    const ping = document.createElement("span");
    ping.className = "marker-ping absolute inset-0 rounded-full";
    ping.style.background = "var(--wx-accent)";
    ping.style.opacity = "0.55";
    const dot = document.createElement("span");
    dot.className = "absolute inset-0 rounded-full border-2";
    dot.style.borderColor = "var(--wx-accent)";
    dot.style.background = "rgba(6,13,22,.75)";
    el.append(ping, dot);
    markerRef.current = new Marker({ element: el })
      .setLngLat([selected.lon, selected.lat])
      .addTo(map);

    map.on("click", (e: MapMouseEvent) => onPickRef.current(e.lngLat.lat, e.lngLat.lng));
    map.getCanvas().style.cursor = "crosshair";

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Mount-only; prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.setLngLat([selected.lon, selected.lat]);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = {
      center: [selected.lon, selected.lat] as [number, number],
      zoom: Math.max(map.getZoom(), 5),
    };
    if (reduced) map.jumpTo(target);
    else map.flyTo({ ...target, duration: 2000, curve: 1.42, essential: true });
  }, [selected.lat, selected.lon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;

      const ensureRaster = (
        id: string,
        tiles: string,
        opts: { opacity: number; maxzoom?: number; tileSize?: number },
      ) => {
        if (!map.getSource(id)) {
          map.addSource(id, {
            type: "raster",
            tiles: [tiles],
            tileSize: opts.tileSize ?? 256,
            maxzoom: opts.maxzoom,
          });
        }
        if (!map.getLayer(id)) {
          map.addLayer({
            id,
            type: "raster",
            source: id,
            layout: { visibility: "none" },
            paint: {
              "raster-opacity": opts.opacity,
              "raster-opacity-transition": { duration: 320, delay: 0 },
            },
          });
        }
      };

      const setVisible = (id: string, visible: boolean) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
        }
      };

      ensureRaster(LAYER_IDS.gibs, gibsTileUrl(GIBS_LAYERS.trueColor, defaultImageryDate()), {
        opacity: 0.9,
        maxzoom: GIBS_LAYERS.trueColor.maxZoom,
      });

      radarFrames.forEach((frame, i) => {
        ensureRaster(radarLayerId(i), frame.tileUrl, {
          opacity: 0.8,
          maxzoom: 10,
          tileSize: 512,
        });
      });

      // Labels sit above every overlay, so place names stay legible.
      if (!map.getLayer(LAYER_IDS.labels)) map.addLayer(LABELS_LAYER);
      else map.moveLayer(LAYER_IDS.labels);

      setVisible(LAYER_IDS.imagery, layers.satellite);
      setVisible(LAYER_IDS.gibs, layers.clouds);
      radarFrames.forEach((_, i) => {
        setVisible(radarLayerId(i), layers.radar && i === frameIndex);
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [layers, radarFrames, frameIndex]);

  return (
    // Sized explicitly rather than with inset-0: maplibre-gl.css sets
    // `.maplibregl-map { position: relative }` on this element, which would
    // override an absolutely-positioned box and collapse it to zero height.
    <div
      ref={containerRef}
      className="size-full"
      aria-label="Interactive world map. Use the search field to choose a location."
    />
  );
}
