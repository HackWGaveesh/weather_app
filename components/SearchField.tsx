"use client";

import { Command } from "cmdk";
import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ApiResult, PlaceRef } from "@/lib/types";

export function SearchField({
  onSelect,
}: {
  onSelect: (place: PlaceRef) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; items: PlaceRef[] }>({
    q: "",
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as ApiResult<PlaceRef[]>;
        setResults({ q, items: json.ok ? json.data : [] });
      } catch {
        // aborted or offline — the empty state below covers it
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const choose = (place: PlaceRef) => {
    onSelect(place);
    setQuery("");
    setResults({ q: "", items: [] });
    setOpen(false);
  };

  // Results are keyed to the query that produced them, so a stale list never
  // shows under a newer query.
  const items = results.q === query.trim() ? results.items : [];
  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <Command shouldFilter={false} loop className="w-full">
        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[rgba(10,22,38,0.86)] px-3 backdrop-blur-md focus-within:border-[var(--line-strong)]">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-[var(--text-faint)]" />
          ) : (
            <Search className="size-4 shrink-0 text-[var(--text-faint)]" aria-hidden />
          )}
          <Command.Input
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search a city"
            aria-label="Search for a place"
            className="h-11 w-full bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
          />
        </div>

        {showPanel && (
          <Command.List className="absolute top-[calc(100%+6px)] z-30 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--line)] bg-[rgba(8,18,31,0.97)] p-1 backdrop-blur-xl">
            {!loading && items.length === 0 && (
              <Command.Empty className="px-3 py-3 text-[13px] text-[var(--text-dim)]">
                No places match “{query.trim()}”. Try a nearby city, or click the map.
              </Command.Empty>
            )}
            {items.map((place) => (
              <Command.Item
                key={`${place.lat},${place.lon},${place.name}`}
                value={`${place.name}-${place.lat}-${place.lon}`}
                onSelect={() => choose(place)}
                className="flex cursor-pointer items-baseline justify-between gap-3 rounded-md px-3 py-2 text-[14px] text-[var(--text)] data-[selected=true]:bg-[rgba(148,180,214,0.1)]"
              >
                <span>{place.name}</span>
                <span className="shrink-0 text-[12px] text-[var(--text-faint)]">
                  {[place.admin, place.country].filter(Boolean).join(", ")}
                </span>
              </Command.Item>
            ))}
          </Command.List>
        )}
      </Command>
    </div>
  );
}
