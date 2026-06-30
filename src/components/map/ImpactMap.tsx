"use client";

import { useMemo, useState } from "react";
import type { MapPin } from "@/lib/types";
import { MAP_PINS, CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { PinCard } from "@/components/map/PinCard";

/**
 * THE GRID — the illustrated tactical map of NYC.
 * A hand-drawn map image (public/map-nyc.png) with interactive win-pins
 * positioned on top via percentage coordinates (pin.mapPosition). Clicking a
 * pin pulls its localized card. No tile layer / Leaflet — lighter on mobile.
 */
const MAP_SRC = "/map-nyc.png";

export function ImpactMap() {
  const [activeId, setActiveId] = useState<string>(MAP_PINS[0]?.id ?? "");
  const activePin = useMemo(
    () => MAP_PINS.find((p) => p.id === activeId),
    [activeId],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      {/* Illustrated map + pin overlay (scrollable on small screens) */}
      <div className="relative max-h-[70vh] overflow-auto border-4 border-outline bg-secondary brutal-shadow-yellow">
        <div className="relative w-full min-w-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MAP_SRC}
            alt="Illustrated tactical map of New York City"
            className="block w-full select-none"
            draggable={false}
          />

          {MAP_PINS.map((pin) =>
            pin.mapPosition ? (
              <MapPinButton
                key={pin.id}
                pin={pin}
                active={pin.id === activeId}
                onSelect={() => setActiveId(pin.id)}
              />
            ) : null,
          )}

          {/* Brutalist coord HUD */}
          <div className="absolute bottom-2 right-2 border-2 border-white bg-black px-2 py-1 font-mono text-[10px] text-secondary">
            <p>LIBERATION PROGRESS: LIVE</p>
          </div>
        </div>
      </div>

      {/* Pin list + localized card */}
      <div className="space-y-3">
        <PinList activeId={activeId} onSelect={setActiveId} />
        {activePin ? (
          <PinCard pin={activePin} />
        ) : (
          <p className="text-lg font-bold text-white">
            Tap a flag on The Grid to read the receipts.
          </p>
        )}
      </div>
    </div>
  );
}

/** A single brutalist square pin positioned over the illustration. */
function MapPinButton({
  pin,
  active,
  onSelect,
}: {
  pin: MapPin;
  active: boolean;
  onSelect: () => void;
}) {
  const color = CATEGORY_COLORS[pin.category];
  const pos = pin.mapPosition!;
  return (
    <button
      onClick={onSelect}
      aria-label={pin.title}
      className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center border-[3px] border-outline transition-all hover:z-10"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: active ? 40 : 32,
        height: active ? 40 : 32,
        backgroundColor: color,
        boxShadow: active ? "4px 4px 0 0 #FFA500" : "3px 3px 0 0 #000",
        fontSize: active ? 20 : 16,
        lineHeight: 1,
      }}
    >
      <span aria-hidden>{CATEGORY_GLYPHS[pin.category]}</span>
    </button>
  );
}

/** Compact selectable list — tappable + keyboard-navigable. */
function PinList({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MAP_PINS.map((pin) => {
        const active = pin.id === activeId;
        const color = CATEGORY_COLORS[pin.category];
        return (
          <button
            key={pin.id}
            onClick={() => onSelect(pin.id)}
            className={`flex min-h-[44px] items-center gap-1.5 border-4 border-outline px-3 py-2 text-sm font-black uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
              active ? "text-white brutal-shadow" : "bg-white text-black brutal-shadow"
            }`}
            style={active ? { backgroundColor: color } : undefined}
          >
            <span aria-hidden>{CATEGORY_GLYPHS[pin.category]}</span>
            {pin.title}
          </button>
        );
      })}
    </div>
  );
}
