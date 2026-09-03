import type { SpeedUnit, TempUnit, WeatherBundle } from "@/lib/types";
import { degToCompass, formatSpeed, timeLabel } from "@/lib/units";
import { WindBarb } from "./WindBarb";

function aqiBand(aqi: number) {
  if (aqi <= 20) return { label: "Good", color: "#4ade80" };
  if (aqi <= 40) return { label: "Fair", color: "#a3e635" };
  if (aqi <= 60) return { label: "Moderate", color: "#facc15" };
  if (aqi <= 80) return { label: "Poor", color: "#fb923c" };
  if (aqi <= 100) return { label: "Very poor", color: "#f87171" };
  return { label: "Extremely poor", color: "#c084fc" };
}

function uvBand(uv: number) {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="hairline flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-[13px] text-[var(--text-dim)]">{label}</span>
      <span className="tnum text-right font-mono text-[13px] text-[var(--text)]">
        {children}
      </span>
    </div>
  );
}

export function MetricRows({
  bundle,
  speedUnit,
  tempUnit,
}: {
  bundle: WeatherBundle;
  speedUnit: SpeedUnit;
  tempUnit: TempUnit;
}) {
  const { current, daily, air, elevation } = bundle;
  const today = daily[0];
  const aqi = air?.europeanAqi ?? null;
  const band = aqi === null ? null : aqiBand(aqi);

  return (
    <section aria-label="Current measurements">
      <div className="flex items-center gap-4 py-1">
        <WindBarb
          speedKmh={current.windKmh}
          directionDeg={current.windDeg}
          className="size-14 shrink-0 text-[var(--wx-accent)]"
        />
        <div>
          <div className="tnum font-mono text-[19px] text-[var(--text)]">
            {formatSpeed(current.windKmh, speedUnit)}
          </div>
          <div className="text-[13px] text-[var(--text-dim)]">
            From the {degToCompass(current.windDeg)}, gusting{" "}
            <span className="tnum font-mono">
              {formatSpeed(current.gustKmh, speedUnit)}
            </span>
          </div>
        </div>
      </div>

      <Row label="Humidity">{Math.round(current.humidity)}%</Row>
      <Row label="Pressure">{Math.round(current.pressureHpa)} hPa</Row>
      <Row label="Cloud cover">{Math.round(current.cloudCover)}%</Row>
      {today && (
        <Row label="UV index">
          {Math.round(today.uvMax)}{" "}
          <span className="font-sans text-[var(--text-dim)]">
            {uvBand(today.uvMax)}
          </span>
        </Row>
      )}
      <Row label="Air quality">
        {aqi !== null && band ? (
          <>
            <span style={{ color: band.color }}>{Math.round(aqi)}</span>{" "}
            <span className="font-sans text-[var(--text-dim)]">{band.label}</span>
          </>
        ) : (
          <span className="font-sans text-[var(--text-faint)]">Not available here</span>
        )}
      </Row>
      {today?.sunrise && (
        <Row label="Sun">
          {timeLabel(today.sunrise)}
          <span className="mx-1.5 text-[var(--line-strong)]">to</span>
          {timeLabel(today.sunset)}
        </Row>
      )}
      {elevation !== null && (
        <Row label="Elevation">
          {Math.round(elevation)} m
          {elevation === 0 && (
            <span className="font-sans text-[var(--text-dim)]"> at sea level</span>
          )}
        </Row>
      )}
      <Row label="Today's range">
        {today ? (
          <>
            {Math.round(tempUnit === "C" ? today.minC : (today.minC * 9) / 5 + 32)}° to{" "}
            {Math.round(tempUnit === "C" ? today.maxC : (today.maxC * 9) / 5 + 32)}°
          </>
        ) : (
          "—"
        )}
      </Row>
    </section>
  );
}
