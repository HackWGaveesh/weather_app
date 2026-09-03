"use client";

import { Pause, Play } from "lucide-react";
import type { MapLayerState } from "./WorldMap";
import type { RadarFrame } from "@/lib/types";
import { cn } from "@/lib/utils";

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-2.5 py-2 text-left text-[13px] transition-colors",
        disabled ? "cursor-not-allowed text-[var(--text-faint)]" : "text-[var(--text)]",
      )}
    >
      <span
        className={cn(
          "relative h-[14px] w-[26px] shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--wx-accent)]" : "bg-[rgba(148,180,214,0.22)]",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] size-[10px] rounded-full bg-[var(--ink-900)] transition-all",
            checked ? "left-[14px]" : "left-[2px]",
          )}
        />
      </span>
      <span className="flex-1">
        {label}
        {hint && (
          <span className="ml-1.5 text-[var(--text-faint)]">{hint}</span>
        )}
      </span>
    </button>
  );
}

function radarTime(unix: number) {
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function LayerControls({
  layers,
  onChange,
  radarFrames,
  frameIndex,
  onFrameIndex,
  playing,
  onPlayingChange,
  imageryDate,
}: {
  layers: MapLayerState;
  onChange: (next: MapLayerState) => void;
  radarFrames: RadarFrame[];
  frameIndex: number;
  onFrameIndex: (i: number) => void;
  playing: boolean;
  onPlayingChange: (v: boolean) => void;
  imageryDate: string;
}) {
  const radarAvailable = radarFrames.length > 0;
  const currentFrame = radarFrames[frameIndex];

  return (
    <div className="w-full rounded-lg border border-[var(--line)] bg-[rgba(8,18,31,0.9)] px-3 py-1.5 backdrop-blur-md lg:w-[236px]">
      <Toggle
        label="Satellite base"
        checked={layers.satellite}
        onChange={(v) => onChange({ ...layers, satellite: v })}
      />
      <div className="hairline" />
      <Toggle
        label="True colour"
        hint={imageryDate}
        checked={layers.clouds}
        onChange={(v) => onChange({ ...layers, clouds: v })}
      />
      <div className="hairline" />
      <Toggle
        label="Rain radar"
        hint={radarAvailable ? undefined : "offline"}
        checked={layers.radar}
        disabled={!radarAvailable}
        onChange={(v) => onChange({ ...layers, radar: v })}
      />

      {layers.radar && radarAvailable && (
        <div className="hairline pt-2 pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPlayingChange(!playing)}
              aria-label={playing ? "Pause radar animation" : "Play radar animation"}
              className="grid size-7 shrink-0 place-items-center rounded-md border border-[var(--line)] text-[var(--text)] hover:border-[var(--line-strong)]"
            >
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={radarFrames.length - 1}
              value={frameIndex}
              onChange={(e) => {
                onPlayingChange(false);
                onFrameIndex(Number(e.target.value));
              }}
              aria-label="Radar time"
              className="h-1 w-full accent-[var(--wx-accent)]"
            />
          </div>
          <p className="tnum mt-1.5 font-mono text-[11px] text-[var(--text-faint)]">
            {currentFrame ? radarTime(currentFrame.time) : "—"}
          </p>
        </div>
      )}
    </div>
  );
}
