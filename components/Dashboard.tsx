"use client";

import { RotateCw } from "lucide-react";
import type { SpeedUnit, TempUnit, WeatherBundle } from "@/lib/types";
import { CurrentHero } from "./CurrentHero";
import { DailyForecast } from "./DailyForecast";
import { MetricRows } from "./MetricRows";
import { TempTrace } from "./TempTrace";

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="skeleton h-6 w-40 rounded" />
      <div className="skeleton h-24 w-52 rounded" />
      <div className="skeleton h-[150px] w-full rounded" />
      <div className="skeleton h-44 w-full rounded" />
    </div>
  );
}

export function Dashboard({
  bundle,
  loading,
  error,
  onRetry,
  tempUnit,
  speedUnit,
  fix,
}: {
  bundle: WeatherBundle | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  tempUnit: TempUnit;
  speedUnit: SpeedUnit;
  fix: { lat: number; lon: number; accuracyM: number } | null;
}) {
  if (error && !bundle) {
    return (
      <div className="py-6">
        <p className="text-[15px] text-[var(--text)]">Weather data didn’t load.</p>
        <p className="mt-1 text-[13px] text-[var(--text-dim)]">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-[13px] text-[var(--text)] hover:border-[var(--line-strong)]"
        >
          <RotateCw className="size-3.5" />
          Try again
        </button>
      </div>
    );
  }

  if (!bundle) return <Skeleton />;

  return (
    <div
      className="space-y-6 transition-opacity duration-300"
      style={{ opacity: loading ? 0.45 : 1 }}
    >
      <CurrentHero bundle={bundle} unit={tempUnit} fix={fix} />
      {error && (
        <p className="text-[12px] text-[var(--text-faint)]">
          Showing the last reading. {error}
        </p>
      )}
      <TempTrace hours={bundle.hourly} unit={tempUnit} />
      <DailyForecast days={bundle.daily} unit={tempUnit} />
      <MetricRows bundle={bundle} speedUnit={speedUnit} tempUnit={tempUnit} />
    </div>
  );
}
