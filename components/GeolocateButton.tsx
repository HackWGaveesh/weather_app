"use client";

import { LoaderCircle, LocateFixed } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "locating" | "error";

export function GeolocateButton({
  onLocate,
}: {
  onLocate: (lat: number, lon: number, accuracyM: number) => void;
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
        onLocate(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy,
        );
      },
      (error) => {
        setStatus("error");
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location access is blocked. Allow it in your browser’s site settings, or search for a city."
            : error.code === error.TIMEOUT
              ? "Locating timed out. On a desktop this can take a moment — try again."
              : "Couldn’t get a location fix. Try again, or search for a city.",
        );
      },
      // Ask for the real fix, never a cached one: this button's whole job is
      // "where am I right now". Coarse mode resolves to the network provider's
      // location, which can be a different city entirely.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
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
