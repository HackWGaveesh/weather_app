"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { TempUnit } from "@/lib/types";

const KEY = "wx.units";
const listeners = new Set<() => void>();

// Set once read or written, so the toggle keeps working even where storage throws.
let cached: TempUnit | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => {
    cached = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): TempUnit {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(KEY) === "F" ? "F" : "C";
  } catch {
    cached = "C";
  }
  return cached;
}

// useSyncExternalStore rather than an effect, so the server render and the
// hydration pass agree before the stored preference is applied.
export function useTempUnit(): [TempUnit, (unit: TempUnit) => void] {
  const unit = useSyncExternalStore(subscribe, getSnapshot, () => "C" as TempUnit);

  const setUnit = useCallback((next: TempUnit) => {
    cached = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // storage unavailable — the preference lasts for this session only
    }
    listeners.forEach((l) => l());
  }, []);

  return [unit, setUnit];
}
