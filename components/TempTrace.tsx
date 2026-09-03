"use client";

import { useMemo, useRef, useState } from "react";
import type { HourPoint, TempUnit } from "@/lib/types";
import { hourLabel, tempValue } from "@/lib/units";

const W = 720;
const H = 150;
const PAD_T = 26;
const PAD_B = 22;

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const d = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

export function TempTrace({
  hours,
  unit,
}: {
  hours: HourPoint[];
  unit: TempUnit;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { points, path, min, max, nightBands } = useMemo(() => {
    const temps = hours.map((h) => h.tempC);
    const lo = Math.min(...temps);
    const hi = Math.max(...temps);
    const span = hi - lo || 1;
    const step = W / Math.max(1, hours.length - 1);

    const pts = hours.map((h, i) => ({
      x: i * step,
      y: PAD_T + (1 - (h.tempC - lo) / span) * (H - PAD_T - PAD_B),
    }));

    // Shade the night hours behind the trace, the way a recording chart marks them.
    const bands: { x: number; width: number }[] = [];
    let start: number | null = null;
    hours.forEach((h, i) => {
      if (!h.isDay && start === null) start = i;
      if ((h.isDay || i === hours.length - 1) && start !== null) {
        bands.push({ x: start * step, width: (i - start) * step });
        start = null;
      }
    });

    return { points: pts, path: smoothPath(pts), min: lo, max: hi, nightBands: bands };
  }, [hours]);

  if (hours.length === 0) return null;

  const hoverIndex = hover;
  const active = hoverIndex === null ? null : hours[hoverIndex];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (hours.length - 1));
    setHover(Math.max(0, Math.min(hours.length - 1, idx)));
  };

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex items-baseline justify-between text-[13px] text-[var(--text-dim)]">
        <span>Next 48 hours</span>
        <span className="tnum font-mono text-[12px] text-[var(--text-faint)]">
          {tempValue(min, unit)}° to {tempValue(max, unit)}°
        </span>
      </figcaption>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-[150px] w-full touch-none"
          preserveAspectRatio="none"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Temperature over the next 48 hours, ranging from ${tempValue(min, unit)} to ${tempValue(max, unit)} degrees`}
        >
          {nightBands.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={0}
              width={b.width}
              height={H}
              fill="rgba(148,180,214,0.06)"
            />
          ))}

          {[0.25, 0.5, 0.75].map((r) => (
            <line
              key={r}
              x1={0}
              x2={W}
              y1={PAD_T + r * (H - PAD_T - PAD_B)}
              y2={PAD_T + r * (H - PAD_T - PAD_B)}
              stroke="var(--line)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path
            d={path}
            fill="none"
            stroke="var(--wx-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {active && hoverIndex !== null && (
            <g>
              <line
                x1={points[hoverIndex].x}
                x2={points[hoverIndex].x}
                y1={0}
                y2={H}
                stroke="var(--line-strong)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r="3.5"
                fill="var(--wx-accent)"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
        </svg>

        {active && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 text-center"
            style={{ left: `${(hoverIndex / (hours.length - 1)) * 100}%` }}
          >
            <div className="tnum whitespace-nowrap font-mono text-[13px] text-[var(--text)]">
              {tempValue(active.tempC, unit)}°
            </div>
            <div className="whitespace-nowrap text-[11px] text-[var(--text-faint)]">
              {hourLabel(active.time)}
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
