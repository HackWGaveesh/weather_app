import type { DayPoint, TempUnit } from "@/lib/types";
import { tempValue, weekdayLabel } from "@/lib/units";
import { describeWeather } from "@/lib/wmo";
import { WeatherIcon } from "./WeatherIcon";

export function DailyForecast({
  days,
  unit,
}: {
  days: DayPoint[];
  unit: TempUnit;
}) {
  const weekMin = Math.min(...days.map((d) => d.minC));
  const weekMax = Math.max(...days.map((d) => d.maxC));
  const span = weekMax - weekMin || 1;

  return (
    <section aria-label="Seven day forecast">
      <h2 className="mb-1 text-[13px] text-[var(--text-dim)]">Next 7 days</h2>
      <ul className="m-0 list-none p-0">
        {days.map((day, i) => {
          const wx = describeWeather(day.code, true);
          const left = ((day.minC - weekMin) / span) * 100;
          const width = ((day.maxC - day.minC) / span) * 100;
          return (
            <li
              key={day.date}
              className="hairline grid grid-cols-[3.1rem_1.5rem_1fr_5.2rem] items-center gap-3 py-2.5"
            >
              <span className="text-[13px] text-[var(--text)]">
                {weekdayLabel(day.date, i)}
              </span>
              <WeatherIcon glyph={wx.icon} className="size-4 text-[var(--text-dim)]" />

              {/* Each day's bar sits on the week's own range, so the shape of the
                  week is readable at a glance. */}
              <span className="relative block h-[3px] rounded-full bg-[rgba(148,180,214,0.14)]">
                <span
                  className="absolute inset-y-0 rounded-full bg-[var(--wx-accent)]"
                  style={{ left: `${left}%`, width: `${Math.max(width, 3)}%` }}
                />
              </span>

              <span className="tnum text-right font-mono text-[13px]">
                <span className="text-[var(--text-faint)]">
                  {tempValue(day.minC, unit)}°
                </span>
                <span className="mx-1.5 text-[var(--line-strong)]">/</span>
                <span className="text-[var(--text)]">{tempValue(day.maxC, unit)}°</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
