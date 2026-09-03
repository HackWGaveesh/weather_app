"use client";

import type { TempUnit, WeatherBundle } from "@/lib/types";
import { formatCoords } from "@/lib/geo";
import { tempValue, timeLabel } from "@/lib/units";
import { describeWeather } from "@/lib/wmo";
import { AnimatedNumber } from "./AnimatedNumber";
import { WeatherIcon } from "./WeatherIcon";

export function CurrentHero({
  bundle,
  unit,
}: {
  bundle: WeatherBundle;
  unit: TempUnit;
}) {
  const { place, current } = bundle;
  const wx = describeWeather(current.code, current.isDay);
  const region = [place.admin, place.country].filter(Boolean).join(", ");

  return (
    <header>
      <h1 className="text-[26px] leading-tight font-medium tracking-[-0.02em] text-[var(--text)]">
        {place.name}
      </h1>
      <p className="mt-0.5 text-[13px] text-[var(--text-dim)]">
        {region || formatCoords(place.lat, place.lon)}
      </p>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="flex items-start">
          <span className="tnum font-mono text-[clamp(4rem,11vw,6.5rem)] leading-[0.82] font-extralight tracking-[-0.05em] text-[var(--text)]">
            <AnimatedNumber value={tempValue(current.tempC, unit)} />
          </span>
          <span className="mt-2 font-mono text-[22px] font-extralight text-[var(--text-dim)]">
            °{unit}
          </span>
        </div>
        <WeatherIcon
          glyph={wx.icon}
          className="mt-1 size-14 shrink-0 text-[var(--wx-accent)]"
        />
      </div>

      <p className="mt-3 text-[15px] text-[var(--text)]">{wx.label}</p>
      <p className="mt-1 text-[13px] text-[var(--text-dim)]">
        Feels like {tempValue(current.feelsLikeC, unit)}°. Local time{" "}
        <span className="tnum font-mono">{timeLabel(current.time)}</span>.
      </p>
    </header>
  );
}
