"use client";

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type MapMouseEvent,
} from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
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
  fix,
}: {
  selected: PlaceRef;
  onPick: (lat: number, lon: number) => void;
  layers: MapLayerState;
  radarFrames: RadarFrame[];
  frameIndex: number;
  fix: { lat: number; lon: number; accuracyM: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const haloRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);
  // Effects that touch the map bail out until it exists; this re-runs them once
  // it does, so an early click still lands.
  const [mapReady, setMapReady] = useState(false);

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

    map.on("load", () => setMapReady(true));
    map.on("click", (e: MapMouseEvent) => onPickRef.current(e.lngLat.lat, e.lngLat.lng));
    map.getCanvas().style.cursor = "crosshair";

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // Mount-only; prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFix =
      fix !== null &&
      Math.abs(fix.lat - selected.lat) < 0.02 &&
      Math.abs(fix.lon - selected.lon) < 0.02;

    // Weather is fetched on a rounded coordinate for cache reuse, but a located
    // fix must be drawn where the device actually is, not on that rounded point.
    markerRef.current?.setLngLat(
      isFix ? [fix.lon, fix.lat] : [selected.lon, selected.lat],
    );

    // A located fix frames its own accuracy radius rather than using a generic
    // zoom, so a precise fix lands on the street and a coarse one visibly doesn't.
    if (isFix) {
      const radiusM = Math.max(fix.accuracyM, 150);
      const dLat = radiusM / 111_320;
      const dLon =
        radiusM / (111_320 * Math.max(Math.cos((fix.lat * Math.PI) / 180), 1e-6));
      map.fitBounds(
        [
          [fix.lon - dLon, fix.lat - dLat],
          [fix.lon + dLon, fix.lat + dLat],
        ],
        { padding: 90, maxZoom: 15, duration: reduced ? 0 : 1800, essential: true },
      );
      return;
    }

    const target = {
      center: [selected.lon, selected.lat] as [number, number],
      zoom: Math.max(map.getZoom(), 8),
    };
    if (reduced) map.jumpTo(target);
    else map.flyTo({ ...target, duration: 2000, curve: 1.42, essential: true });
  }, [selected.lat, selected.lon, fix, mapReady]);

  // Accuracy halo around a located fix, drawn as a DOM marker rather than a
  // GeoJSON layer so it never depends on the worker tile pipeline. The marker is
  // recreated on every run: a remounted map leaves any previous one bound to a
  // dead instance, where it silently stops rendering.
  useEffect(() => {
    const map = mapRef.current;
    haloRef.current?.remove();
    haloRef.current = null;
    if (!map || !fix) return;

    const el = document.createElement("div");
    el.style.borderRadius = "9999px";
    el.style.border = "1.5px solid rgba(125,211,252,0.85)";
    el.style.background = "rgba(56,189,248,0.16)";
    el.style.pointerEvents = "none";

    const marker = new Marker({ element: el }).setLngLat([fix.lon, fix.lat]).addTo(map);
    haloRef.current = marker;

    const resize = () => {
      const metersPerPixel =
        (156543.03392 * Math.cos((fix.lat * Math.PI) / 180)) / 2 ** map.getZoom();
      const diameter = (2 * fix.accuracyM) / metersPerPixel;
      // Below a few pixels the halo just fights the marker dot for space.
      el.style.width = `${diameter}px`;
      el.style.height = `${diameter}px`;
      el.style.display = diameter >= 12 ? "block" : "none";
    };

    resize();
    map.on("zoom", resize);
    map.on("move", resize);
    return () => {
      map.off("zoom", resize);
      map.off("move", resize);
      marker.remove();
      if (haloRef.current === marker) haloRef.current = null;
    };
  }, [fix, mapReady]);

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
  }, [layers, radarFrames, frameIndex, mapReady]);

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
