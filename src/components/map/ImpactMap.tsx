"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MapPin } from "@/lib/types";
import { MAP_PINS, CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { PinCard } from "@/components/map/PinCard";

/**
 * THE GRID — the illustrated tactical map of NYC.
 * A hand-drawn map image with interactive win-pins positioned on top via
 * percentage coordinates (pin.mapPosition). Supports zoom (+/- buttons +
 * wheel) and pan (native touch/scroll). No Leaflet — lighter on mobile.
 *
 * Plot mode: append `?plot=1` to the URL to turn the map into a coordinate
 * picker — click any landmark and its { x, y } percentage is copied to the
 * clipboard (and shown), so pin positions can be dialed in exactly.
 */
const MAP_SRC = "/map-nyc.webp";
const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function ImpactMap() {
  const [activeId, setActiveId] = useState<string>(MAP_PINS[0]?.id ?? "");
  const [scale, setScale] = useState(1);
  const [plotMode, setPlotMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const activePin = useMemo(
    () => MAP_PINS.find((p) => p.id === activeId),
    [activeId],
  );

  // Enable the coordinate picker via ?plot=1.
  useEffect(() => {
    setPlotMode(new URLSearchParams(window.location.search).has("plot"));
  }, []);

  const zoom = (dir: 1 | -1) =>
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + dir * 0.5).toFixed(2))));

  const onWheel = (e: React.WheelEvent) => {
    if (e.deltaY === 0) return;
    e.preventDefault();
    setScale((s) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s - Math.sign(e.deltaY) * 0.3).toFixed(2))),
    );
  };

  // Plot-mode click → percentage of the image, copied to clipboard.
  const onImageClick = (e: React.MouseEvent) => {
    if (!plotMode || !imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1);
    const text = `{ x: ${x}, y: ${y} }`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setToast(`${text} — copied`);
    window.clearTimeout((onImageClick as { _t?: number })._t);
    (onImageClick as { _t?: number })._t = window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      {/* Illustrated map viewport. On mobile: a fixed-height scroll/zoom box.
          On desktop (lg): sized to the image's aspect ratio so the whole
          portrait map is exposed without internal scrolling. */}
      <div className="relative h-[64vh] overflow-hidden border-4 border-outline bg-secondary brutal-shadow-yellow sm:h-[560px] lg:h-auto lg:aspect-[1536/2752]">
        <div className="h-full w-full overflow-auto" onWheel={onWheel}>
          <div
            className="relative origin-top-left"
            style={{ width: `${scale * 100}%`, minWidth: 420 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={MAP_SRC}
              alt="Illustrated tactical map of New York City"
              onClick={onImageClick}
              className={`block w-full select-none ${plotMode ? "cursor-crosshair" : ""}`}
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
          </div>
        </div>

        {/* Zoom HUD */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-2">
          <HudBtn label="+" onClick={() => zoom(1)} />
          <HudBtn label="−" onClick={() => zoom(-1)} />
        </div>

        {/* Status HUD */}
        <div className="absolute bottom-2 right-2 border-2 border-white bg-black px-2 py-1 font-mono text-[10px] text-secondary">
          LIBERATION PROGRESS: LIVE
        </div>

        {/* Plot-mode helpers */}
        {plotMode && (
          <div className="absolute left-2 top-2 border-2 border-outline bg-tertiary px-2 py-1 text-[10px] font-black uppercase text-white">
            Plot Mode · click to copy coords
          </div>
        )}
        {toast && (
          <div className="absolute right-2 top-2 border-2 border-outline bg-white px-2 py-1 font-mono text-[11px] font-bold text-black">
            {toast}
          </div>
        )}
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
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      aria-label={pin.title}
      className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center border-[3px] border-outline transition-all hover:z-10"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: active ? 36 : 30,
        height: active ? 36 : 30,
        backgroundColor: color,
        boxShadow: active ? "3px 3px 0 0 #FFA500" : "2px 2px 0 0 #000",
        fontSize: active ? 18 : 15,
        lineHeight: 1,
      }}
    >
      <span aria-hidden>{CATEGORY_GLYPHS[pin.category]}</span>
    </button>
  );
}

function HudBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label === "+" ? "Zoom in" : "Zoom out"}
      className="grid h-9 w-9 place-items-center border-2 border-outline bg-white text-xl font-black text-black brutal-shadow-sm hover:bg-secondary"
    >
      {label}
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
