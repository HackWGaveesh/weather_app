"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { normalizeLon, roundCoord } from "@/lib/geo";
import { PRESETS } from "@/lib/presets";
import { auraFor } from "@/lib/theme";
import { defaultImageryDate, ATTRIBUTION } from "@/lib/tiles";
import type {
  ApiResult,
  PlaceRef,
  RadarIndex,
  SpeedUnit,
  WeatherBundle,
} from "@/lib/types";
import { describeWeather } from "@/lib/wmo";
import { useTempUnit } from "@/hooks/useTempUnit";
import { Dashboard } from "./Dashboard";
import { GeolocateButton } from "./GeolocateButton";
import { LayerControls } from "./LayerControls";
import { SearchField } from "./SearchField";
import { UnitToggle } from "./UnitToggle";
import WorldMap, { type MapLayerState } from "./WorldMapClient";

type Selection = Pick<PlaceRef, "lat" | "lon"> &
  Partial<Pick<PlaceRef, "name" | "admin" | "country">>;

function weatherKey(sel: Selection) {
  const params = new URLSearchParams({
    lat: String(roundCoord(sel.lat)),
    lon: String(roundCoord(normalizeLon(sel.lon))),
  });
  if (sel.name) params.set("name", sel.name);
  if (sel.admin) params.set("admin", sel.admin);
  if (sel.country) params.set("country", sel.country);
  return `/api/weather?${params}`;
}

async function fetcher(url: string): Promise<WeatherBundle> {
  const res = await fetch(url);
  const json = (await res.json()) as ApiResult<WeatherBundle>;
  if (!json.ok) throw new Error(json.error.message);
  return json.data;
}

export function AppShell({
  initialBundle,
  initialSelection,
}: {
  initialBundle: WeatherBundle | null;
  initialSelection: Selection;
}) {
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [tempUnit, setTempUnit] = useTempUnit();
  const [layers, setLayers] = useState<MapLayerState>({
    satellite: false,
    clouds: false,
    radar: false,
  });
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const speedUnit: SpeedUnit = tempUnit === "C" ? "kmh" : "mph";

  const key = weatherKey(selection);
  const { data, error, isValidating, mutate } = useSWR<WeatherBundle>(key, fetcher, {
    fallbackData:
      initialBundle && weatherKey(initialSelection) === key ? initialBundle : undefined,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const { data: radar } = useSWR<RadarIndex>(
    "/api/radar",
    async (url: string) => {
      const res = await fetch(url);
      const json = (await res.json()) as ApiResult<RadarIndex>;
      if (!json.ok) throw new Error(json.error.message);
      return json.data;
    },
    { revalidateOnFocus: false, refreshInterval: 300_000 },
  );

  const radarFrames = useMemo(() => radar?.frames ?? [], [radar]);

  // Newest frame unless the scrubber has been moved, so no effect is needed to
  // re-seed the index when frames arrive.
  const frameIndex =
    scrubIndex === null
      ? Math.max(0, radarFrames.length - 1)
      : Math.min(scrubIndex, Math.max(0, radarFrames.length - 1));

  // The interface takes its colour from the conditions it is describing.
  useEffect(() => {
    if (!data) return;
    const wx = describeWeather(data.current.code, data.current.isDay);
    const aura = auraFor(wx.theme);
    const root = document.documentElement;
    root.style.setProperty("--wx-1", aura.wx1);
    root.style.setProperty("--wx-2", aura.wx2);
    root.style.setProperty("--wx-3", aura.wx3);
    root.style.setProperty("--wx-accent", aura.accent);
  }, [data]);

  // Keep the location in the URL so a view can be shared as a link.
  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams({
      lat: String(roundCoord(data.place.lat)),
      lon: String(roundCoord(data.place.lon)),
      name: data.place.name,
    });
    if (data.place.admin) params.set("admin", data.place.admin);
    if (data.place.country) params.set("country", data.place.country);
    window.history.replaceState(null, "", `/?${params}`);
  }, [data]);

  useEffect(() => {
    if (!playing || !layers.radar || radarFrames.length === 0) return;
    const id = setInterval(
      () => setScrubIndex((i) => ((i ?? radarFrames.length - 1) + 1) % radarFrames.length),
      450,
    );
    return () => clearInterval(id);
  }, [playing, layers.radar, radarFrames.length]);

  const pickCoords = useCallback((lat: number, lon: number) => {
    setSelection({ lat, lon: normalizeLon(lon) });
  }, []);

  const pickPlace = useCallback((place: PlaceRef) => {
    setSelection({
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      admin: place.admin,
      country: place.country,
    });
  }, []);

  const announcement = data
    ? `${data.place.name}. ${describeWeather(data.current.code, data.current.isDay).label}, ${Math.round(data.current.tempC)} degrees Celsius.`
    : "";

  const mapSelection: PlaceRef = data?.place ?? {
    lat: selection.lat,
    lon: selection.lon,
    name: selection.name ?? "",
    source: "map",
  };

  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <div className="wx-aura" aria-hidden />

      <div className="absolute inset-0 z-10">
        <WorldMap
          selected={mapSelection}
          onPick={pickCoords}
          layers={layers}
          radarFrames={radarFrames}
          frameIndex={frameIndex}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col lg:flex-row">
        {/* Controls */}
        <div className="pointer-events-none flex flex-1 flex-col justify-between p-3 sm:p-4">
          <div className="pointer-events-auto flex w-full max-w-[560px] items-start gap-2">
            <SearchField onSelect={pickPlace} />
            <GeolocateButton onLocate={pickCoords} />
            <UnitToggle unit={tempUnit} onChange={setTempUnit} />
          </div>

          <div className="pointer-events-auto hidden lg:block">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => pickPlace(p)}
                  className="rounded-full border border-[var(--line)] bg-[rgba(8,18,31,0.8)] px-3 py-1.5 text-[12px] text-[var(--text-dim)] backdrop-blur-md transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text)]"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <LayerControls
              layers={layers}
              onChange={setLayers}
              radarFrames={radarFrames}
              frameIndex={frameIndex}
              onFrameIndex={setScrubIndex}
              playing={playing}
              onPlayingChange={setPlaying}
              imageryDate={defaultImageryDate()}
            />
            <p className="mt-2 max-w-[236px] rounded-md bg-[rgba(8,18,31,0.82)] px-2 py-1.5 text-[10px] leading-relaxed text-[var(--text-faint)] backdrop-blur-md">
              {ATTRIBUTION.weather}. {ATTRIBUTION.radar}. {ATTRIBUTION.satellite}.
            </p>
          </div>
        </div>

        {/* Reading rail */}
        <div
          className="scrim-rail pointer-events-auto max-h-[58dvh] w-full shrink-0 overflow-y-auto border-t border-[var(--line)] px-4 py-5 backdrop-blur-xl lg:max-h-none lg:h-full lg:w-[400px] lg:border-t-0 lg:border-l lg:px-6 lg:py-6"
        >
          <Dashboard
            bundle={data}
            loading={isValidating}
            error={errorMessage}
            onRetry={() => mutate()}
            tempUnit={tempUnit}
            speedUnit={speedUnit}
          />

          <div className="mt-6 lg:hidden">
            <LayerControls
              layers={layers}
              onChange={setLayers}
              radarFrames={radarFrames}
              frameIndex={frameIndex}
              onFrameIndex={setScrubIndex}
              playing={playing}
              onPlayingChange={setPlaying}
              imageryDate={defaultImageryDate()}
            />
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </main>
  );
}
