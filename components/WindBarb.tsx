import { degToCompass } from "@/lib/units";

// A standard meteorological wind barb: the staff points into the wind, a pennant
// is 50 knots, a full barb 10, a half barb 5.
export function WindBarb({
  speedKmh,
  directionDeg,
  className,
}: {
  speedKmh: number;
  directionDeg: number;
  className?: string;
}) {
  const knots = speedKmh * 0.539957;
  const label = `Wind from ${degToCompass(directionDeg)}, ${Math.round(knots)} knots`;

  if (knots < 2) {
    return (
      <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Calm">
        <circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  }

  let remaining = Math.round(knots / 5) * 5;
  const pennants = Math.floor(remaining / 50);
  remaining -= pennants * 50;
  const fulls = Math.floor(remaining / 10);
  remaining -= fulls * 10;
  const halves = remaining >= 5 ? 1 : 0;

  const tipY = 10;
  const baseY = 50;
  const marks: React.ReactNode[] = [];
  let y = tipY;
  const step = 7;
  const barbLen = 20;

  for (let i = 0; i < pennants; i++) {
    marks.push(
      <polygon
        key={`p${i}`}
        points={`50,${y} 50,${y + 9} ${50 + barbLen},${y + 4.5}`}
        fill="currentColor"
      />,
    );
    y += 11;
  }
  for (let i = 0; i < fulls; i++) {
    marks.push(
      <line
        key={`f${i}`}
        x1="50"
        y1={y}
        x2={50 + barbLen}
        y2={y - 7}
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />,
    );
    y += step;
  }
  if (halves) {
    // A half barb never sits at the very tip of the staff.
    if (y === tipY) y += step;
    marks.push(
      <line
        key="h"
        x1="50"
        y1={y}
        x2={50 + barbLen / 2}
        y2={y - 3.5}
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />,
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={label}>
      <g transform={`rotate(${directionDeg} 50 50)`}>
        <line
          x1="50"
          y1={tipY}
          x2="50"
          y2={baseY}
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {marks}
      </g>
      <circle cx="50" cy="50" r="4.5" fill="currentColor" />
    </svg>
  );
}
