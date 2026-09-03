"use client";

import type { TempUnit } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UnitToggle({
  unit,
  onChange,
}: {
  unit: TempUnit;
  onChange: (u: TempUnit) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Temperature unit"
      className="flex shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[rgba(10,22,38,0.86)] backdrop-blur-md"
    >
      {(["C", "F"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          aria-pressed={unit === u}
          className={cn(
            "h-11 w-11 font-mono text-[13px] transition-colors",
            unit === u
              ? "bg-[rgba(148,180,214,0.14)] text-[var(--text)]"
              : "text-[var(--text-faint)] hover:text-[var(--text-dim)]",
          )}
        >
          °{u}
        </button>
      ))}
    </div>
  );
}
