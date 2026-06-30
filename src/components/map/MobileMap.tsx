"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAP_PINS, CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { PinCard } from "@/components/map/PinCard";
import type { WinCategory } from "@/lib/types";

/**
 * MobileMap — the full-screen, page-locked map experience (<lg only).
 * The map is the whole surface below the nav; only the map pans/zooms, the
 * page itself doesn't scroll. A dismissible welcome panel holds the intro +
 * a tappable directory of wins; tapping a pin (or a directory row) opens a
 * floating detail window over the map.
 */
const MAP_SRC = "/map-nyc.webp";
const MIN_SCALE = 1;
const MAX_SCALE = 4;

const LEGEND: Array<{ cat: WinCategory; label: string }> = [
  { cat: "pools", label: "Pools" },
  { cat: "infrastructure", label: "Infrastructure" },
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
      {/* Pannable / zoomable map surface */}
      <div className="h-full w-full overflow-auto">
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
                className="absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center border-[3px] border-outline text-lg shadow-[2px_2px_0_0_#000]"
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

      {/* Zoom HUD */}
      <div className="absolute bottom-4 left-3 z-10 flex flex-col gap-2">
        <ZoomBtn label="+" onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + 0.5).toFixed(2)))} />
        <ZoomBtn label="−" onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - 0.5).toFixed(2)))} />
      </div>

      {/* Plot helpers */}
      {plotMode && (
        <div className="absolute left-3 top-3 z-10 border-2 border-outline bg-tertiary px-2 py-1 text-[10px] font-black uppercase text-white">
          Plot · tap to copy coords
        </div>
      )}
      {toast && (
        <div className="absolute right-3 top-3 z-10 border-2 border-outline bg-white px-2 py-1 font-mono text-[11px] font-bold text-black">
          {toast}
        </div>
      )}

      {/* Reopen-intel button (when welcome is dismissed and nothing is open) */}
      {!welcome && !active && (
        <button
          onClick={() => setWelcome(true)}
          className="absolute right-3 top-3 z-20 border-2 border-outline bg-white px-3 py-2 text-xs font-black uppercase text-primary shadow-brutal"
        >
          ⓘ Intel
        </button>
      )}

      {/* Welcome / directory overlay */}
      {welcome && (
        <div className="absolute inset-x-3 top-3 z-30 max-h-[calc(100%-1.5rem)] overflow-auto border-4 border-outline bg-surface shadow-brutal">
          <div className="flex items-start justify-between gap-2 border-b-4 border-outline bg-primary px-4 py-3 text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary">
                Live Uplink · NYC Command
              </p>
              <h1 className="brutal-heading text-2xl leading-none">The Grid</h1>
            </div>
            <button
              onClick={() => setWelcome(false)}
              aria-label="Dismiss"
              className="grid h-8 w-8 shrink-0 place-items-center border-2 border-outline bg-white font-black text-black"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3 px-4 py-4">
            <p className="text-base font-bold text-on-surface">
              Every flag is a confirmed material win. Tap a pin on the map — or a
              win below — to pull its briefing.
            </p>
            <ul className="divide-y-2 divide-outline/20 border-2 border-outline">
              {MAP_PINS.map((pin) => (
                <li key={pin.id}>
                  <button
                    onClick={() => open(pin.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary"
                  >
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center border-2 border-outline text-sm"
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
            <div className="flex flex-wrap gap-2 pt-1">
              {LEGEND.map(({ cat, label }) => (
                <span key={cat} className="flex items-center gap-1 text-xs font-black uppercase text-on-surface/70">
                  <span
                    className="inline-block h-3 w-3 border border-outline"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  {label}
                </span>
              ))}
            </div>
            <button
              onClick={() => setWelcome(false)}
              className="btn-brutal w-full bg-primary text-white brutal-shadow"
            >
              Explore the map →
            </button>
          </div>
        </div>
      )}

      {/* Pin detail window */}
      {active && (
        <div className="absolute inset-x-3 bottom-4 z-30 max-h-[78%] overflow-auto shadow-brutal">
          <PinCard pin={active} onClose={() => setActiveId(null)} />
        </div>
      )}
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
