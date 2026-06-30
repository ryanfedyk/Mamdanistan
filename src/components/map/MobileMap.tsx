"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAP_PINS, CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { PinCard } from "@/components/map/PinCard";
import type { WinCategory } from "@/lib/types";

/**
 * MobileMap — the full-screen, page-locked map experience (<lg only).
 * The map is the whole surface below the nav; only the map pans/zooms. UI
 * floats over it as Google-Maps-style bottom sheets that stay a fixed screen
 * size regardless of map zoom. Native pinch-zoom is suppressed on the map
 * surface (it would scale the whole viewport incl. overlays) — zoom is driven
 * by the on-screen buttons instead.
 */
const MAP_SRC = "/map-nyc.webp";
const MIN_SCALE = 1;
const MAX_SCALE = 4;

const LEGEND: Array<{ cat: WinCategory; label: string }> = [
  { cat: "pools", label: "Pools" },
  { cat: "infrastructure", label: "Infra" },
  { cat: "housing", label: "Housing" },
  { cat: "transit", label: "Transit" },
];

export function MobileMap() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(true);
  const [scale, setScale] = useState(1.6);
  const [plotMode, setPlotMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const active = useMemo(
    () => MAP_PINS.find((p) => p.id === activeId) ?? null,
    [activeId],
  );

  useEffect(() => {
    setPlotMode(new URLSearchParams(window.location.search).has("plot"));
  }, []);

  const open = (id: string) => {
    setActiveId(id);
    setWelcome(false);
  };

  const onImageClick = (e: React.MouseEvent) => {
    if (!plotMode || !imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1);
    const text = `{ x: ${x}, y: ${y} }`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setToast(`${text} — copied`);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-[60px] z-40 bg-secondary lg:hidden">
      {/* Pannable map surface. touch-action pan-* allows scroll-pan but blocks
          native pinch-zoom (which would scale the overlays too). */}
      <div
        className="h-full w-full overflow-auto"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div className="relative" style={{ width: `${scale * 100}%`, minWidth: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={MAP_SRC}
            alt="Illustrated map of New York City"
            onClick={onImageClick}
            className={`block w-full select-none ${plotMode ? "cursor-crosshair" : ""}`}
            draggable={false}
          />
          {MAP_PINS.map((pin) =>
            pin.mapPosition ? (
              <button
                key={pin.id}
                onClick={() => open(pin.id)}
                aria-label={pin.title}
                className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center border-[3px] border-outline text-base shadow-[2px_2px_0_0_#000]"
                style={{
                  left: `${pin.mapPosition.x}%`,
                  top: `${pin.mapPosition.y}%`,
                  backgroundColor: CATEGORY_COLORS[pin.category],
                  outline: pin.id === activeId ? "3px solid #FFA500" : undefined,
                }}
              >
                <span aria-hidden>{CATEGORY_GLYPHS[pin.category]}</span>
              </button>
            ) : null,
          )}
        </div>
      </div>

      {/* Zoom HUD (fixed screen size) */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-2">
        <ZoomBtn label="+" onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + 0.5).toFixed(2)))} />
        <ZoomBtn label="−" onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - 0.5).toFixed(2)))} />
      </div>

      {/* Plot helpers */}
      {plotMode && (
        <div className="absolute left-3 top-3 z-10 border-2 border-outline bg-tertiary px-2 py-1 text-[10px] font-black uppercase text-white">
          Plot · tap to copy
        </div>
      )}
      {toast && (
        <div className="absolute right-3 top-3 z-10 border-2 border-outline bg-white px-2 py-1 font-mono text-[11px] font-bold text-black">
          {toast}
        </div>
      )}

      {/* Reopen-intel button */}
      {!welcome && !active && (
        <button
          onClick={() => setWelcome(true)}
          className="absolute right-3 top-3 z-20 border-2 border-outline bg-white px-3 py-2 text-xs font-black uppercase text-primary shadow-brutal"
        >
          ⓘ Intel
        </button>
      )}

      {/* Welcome / directory bottom sheet */}
      {welcome && (
        <BottomSheet onClose={() => setWelcome(false)}>
          <div className="border-b-2 border-outline bg-primary px-4 py-2 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">
              Live Uplink · NYC Command
            </p>
            <h1 className="brutal-heading text-xl leading-none">The Grid</h1>
          </div>
          <div className="space-y-3 px-4 py-3">
            <p className="text-sm font-bold text-on-surface">
              Every flag is a confirmed material win. Tap a pin — or a win below
              — for its briefing.
            </p>
            <ul className="border-2 border-outline">
              {MAP_PINS.map((pin) => (
                <li key={pin.id} className="border-b-2 border-outline/20 last:border-0">
                  <button
                    onClick={() => open(pin.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary"
                  >
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center border-2 border-outline text-xs"
                      style={{ backgroundColor: CATEGORY_COLORS[pin.category] }}
                      aria-hidden
                    >
                      {CATEGORY_GLYPHS[pin.category]}
                    </span>
                    <span className="text-sm font-black uppercase text-on-surface">
                      {pin.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {LEGEND.map(({ cat, label }) => (
                <span key={cat} className="flex items-center gap-1 text-[11px] font-black uppercase text-on-surface/70">
                  <span className="inline-block h-3 w-3 border border-outline" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Pin detail bottom sheet */}
      {active && (
        <BottomSheet key={active.id} onClose={() => setActiveId(null)}>
          <PinCard pin={active} bare />
        </BottomSheet>
      )}
    </div>
  );
}

/**
 * A Google-Maps-style bottom sheet: peeks by default, tap the grab handle to
 * expand/collapse. Fixed to the viewport, so it never scales with map zoom.
 */
function BottomSheet({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col border-t-4 border-outline bg-surface shadow-[0_-6px_0_0_#000] transition-[height] duration-200 ${
        expanded ? "h-[90%]" : "h-[52%]"
      }`}
    >
      <div className="flex items-center gap-2 border-b-2 border-outline px-2 py-1">
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="flex flex-1 justify-center py-2"
        >
          <span className="h-1.5 w-12 rounded-full bg-outline/40" />
        </button>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-7 w-7 shrink-0 place-items-center border-2 border-outline bg-white font-black text-black"
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function ZoomBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label === "+" ? "Zoom in" : "Zoom out"}
      className="grid h-10 w-10 place-items-center border-2 border-outline bg-white text-xl font-black text-black brutal-shadow-sm"
    >
      {label}
    </button>
  );
}
