"use client";

import { LoaderCircle, LocateFixed } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "locating" | "error";

export function GeolocateButton({
  onLocate,
}: {
  onLocate: (lat: number, lon: number) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setMessage("This browser can’t share a location. Search for a city instead.");
      return;
    }

    setStatus("locating");
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("idle");
        onLocate(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setStatus("error");
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location access is blocked. Allow it in your browser’s site settings, or search for a city."
            : "Couldn’t get a location fix. Try again, or search for a city.",
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={locate}
        disabled={status === "locating"}
        aria-label="Use my current location"
        className={cn(
          "grid h-11 w-11 place-items-center rounded-lg border border-[var(--line)] bg-[rgba(10,22,38,0.86)] backdrop-blur-md transition-colors",
          status === "error"
            ? "text-[var(--text-dim)]"
            : "text-[var(--text-dim)] hover:border-[var(--line-strong)] hover:text-[var(--text)]",
        )}
      >
        {status === "locating" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LocateFixed className="size-4" />
        )}
      </button>

      {message && (
        <p
          role="alert"
          className="absolute top-[calc(100%+6px)] right-0 z-30 w-60 rounded-lg border border-[var(--line)] bg-[rgba(8,18,31,0.97)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-dim)] backdrop-blur-xl"
        >
          {message}
        </p>
      )}
    </div>
  );
}
