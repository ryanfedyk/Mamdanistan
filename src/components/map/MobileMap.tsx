"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAP_PINS, CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { PinCard } from "@/components/map/PinCard";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { MapPin, WinCategory } from "@/lib/types";

/**
 * MobileMap — page-locked tactical map (all screen sizes).
 * Google-Maps-style:
 * - drag to pan; pinch (touch) or mouse-wheel (desktop) to zoom; +/- buttons;
 * - on phones a briefing opens in a draggable bottom sheet;
 * - on desktop the map is framed to a centered column (no disorienting
 *   full-bleed zoom) and a briefing opens in a left-docked side panel that
 *   preserves the tall map's height;
 * - interacting with the map dismisses an open sheet / panel;
 * - opening a briefing centers the chosen pin in the visible band.
 */
const MAP_SRC = "/map-nyc.webp";
const IMG_W = 1536;
const IMG_H = 2752;
const ASPECT = IMG_H / IMG_W;
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const PEEK = 0.5; // bottom-sheet height as a fraction of the map area (mobile)

const LEGEND: Array<{ cat: WinCategory; label: string }> = [
  { cat: "pools", label: "Pools" },
  { cat: "infrastructure", label: "Infra" },
  { cat: "housing", label: "Housing" },
  { cat: "transit", label: "Transit" },
  { cat: "labor", label: "Labor" },
  { cat: "health", label: "Health" },
  { cat: "food", label: "Food" },
  { cat: "climate", label: "Climate" },
  { cat: "consumer", label: "Consumer" },
  { cat: "campaign", label: "Campaign" },
  { cat: "culture", label: "Culture" },
];

type Pointers = Map<number, { x: number; y: number }>;
type Gesture =
  | { mode: "pan"; lastX: number; lastY: number }
  | { mode: "pinch"; dist: number; scale: number; fracX: number; fracY: number }
  | null;

export function MobileMap() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(true);
  const [scale, setScale] = useState(2.4);
  const [plotMode, setPlotMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const ptrs = useRef<Pointers>(new Map());
  const gest = useRef<Gesture>(null);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const active = useMemo(
    () => MAP_PINS.find((p) => p.id === activeId) ?? null,
    [activeId],
  );

  useEffect(() => {
    setPlotMode(new URLSearchParams(window.location.search).has("plot"));
  }, []);

  // Center the map on mount (nice on desktop where the window is wide).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const contentW = Math.max(cw, cw * scaleRef.current);
    const contentH = contentW * ASPECT;
    el.scrollLeft = (contentW - cw) / 2;
    el.scrollTop = contentH * 0.14; // start on the upper boroughs
  }, []);

  // Desktop mouse-wheel zoom toward the cursor (non-passive so we can stop the
  // native scroll). Drag still pans; the +/- buttons still work.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cur = scaleRef.current;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(cur * (e.deltaY < 0 ? 1.12 : 1 / 1.12)).toFixed(3)));
      if (next === cur) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cw = el.clientWidth;
      const oldW = Math.max(cw, cw * cur);
      const newW = Math.max(cw, cw * next);
      const fracX = (el.scrollLeft + mx) / oldW;
      const fracY = (el.scrollTop + my) / (oldW * ASPECT);
      if (contentRef.current) contentRef.current.style.width = `${next * 100}%`;
      el.scrollLeft = fracX * newW - mx;
      el.scrollTop = fracY * (newW * ASPECT) - my;
      scaleRef.current = next;
      setScale(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const setZoom = (s: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, +s.toFixed(2)));
    scaleRef.current = clamped;
    setScale(clamped);
  };

  const centerOnPin = (pin: MapPin) => {
    const el = scrollRef.current;
    if (!el || !pin.mapPosition) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const contentW = Math.max(cw, cw * scaleRef.current);
    const contentH = contentW * ASPECT;
    const px = (pin.mapPosition.x / 100) * contentW;
    const py = (pin.mapPosition.y / 100) * contentH;
    // Phones get a bottom sheet over the lower half; desktop's briefing docks
    // to the left, so the full map height stays visible.
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const visibleH = ch * (desktop ? 1 : 1 - PEEK);
    el.scrollTo({ left: px - cw / 2, top: py - visibleH / 2, behavior: "smooth" });
  };

  const open = (id: string) => {
    const pin = MAP_PINS.find((p) => p.id === id);
    setActiveId(id);
    setWelcome(false);
    if (pin) requestAnimationFrame(() => centerOnPin(pin));
  };

  const dismissOnMap = () => {
    if (active || welcome) {
      setActiveId(null);
      setWelcome(false);
    }
  };

  // ---- custom pan + pinch (map only) ----
  const onPointerDown = (e: React.PointerEvent) => {
    dismissOnMap();
    const el = scrollRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 1) {
      gest.current = { mode: "pan", lastX: e.clientX, lastY: e.clientY };
    } else if (ptrs.current.size === 2) {
      startPinch();
    }
  };

  const startPinch = () => {
    const el = scrollRef.current;
    if (!el) return;
    const pts = [...ptrs.current.values()];
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
    const rect = el.getBoundingClientRect();
    const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
    const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
    const cw = el.clientWidth;
    const contentW = Math.max(cw, cw * scaleRef.current);
    const contentH = contentW * ASPECT;
    gest.current = {
      mode: "pinch",
      dist,
      scale: scaleRef.current,
      fracX: (el.scrollLeft + midX) / contentW,
      fracY: (el.scrollTop + midY) / contentH,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const el = scrollRef.current;
    const g = gest.current;
    if (!el || !g) return;

    if (g.mode === "pan" && ptrs.current.size === 1) {
      el.scrollLeft -= e.clientX - g.lastX;
      el.scrollTop -= e.clientY - g.lastY;
      g.lastX = e.clientX;
      g.lastY = e.clientY;
    } else if (g.mode === "pinch" && ptrs.current.size >= 2) {
      const pts = [...ptrs.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, g.scale * (dist / g.dist)));
      const cw = el.clientWidth;
      const contentW = Math.max(cw, cw * newScale);
      const contentH = contentW * ASPECT;
      const rect = el.getBoundingClientRect();
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
      if (contentRef.current) contentRef.current.style.width = `${newScale * 100}%`;
      el.scrollLeft = g.fracX * contentW - midX;
      el.scrollTop = g.fracY * contentH - midY;
      scaleRef.current = newScale;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) {
      gest.current = null;
      setScale(scaleRef.current); // sync React (keeps +/- buttons in step)
    } else if (ptrs.current.size === 1) {
      const [p] = [...ptrs.current.values()];
      gest.current = { mode: "pan", lastX: p.x, lastY: p.y };
    }
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

  // The accomplishments directory — reused by the desktop panel and the mobile
  // welcome sheet.
  const directory = (
    <>
      <div className="border-b-2 border-outline bg-primary px-4 py-2 text-white">
        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">
          Live Uplink · NYC Command
        </p>
        <h1 className="brutal-heading text-xl leading-none">The Grid</h1>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="space-y-2 border-2 border-outline bg-secondary/40 px-3 py-2">
          <p className="text-sm font-bold text-on-surface">
            The Grid is a live tactical map of Mamdanistan — every flag is a
            confirmed material win for New Yorkers, from fare-free buses to the
            rent freeze to $0 inhalers.
          </p>
          <p className="text-[13px] font-semibold text-on-surface/80">
            Drag to pan, pinch or scroll to zoom, and tap any flag on the map —
            or a win in the list below — to pull up its full briefing.
          </p>
        </div>
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
    </>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 top-[64px] z-40 bg-secondary sm:top-[68px] lg:top-[92px]">
      {/* Center the whole panel + map group so wide monitors get even gutters
          on both sides instead of everything pinned to the left. */}
      <div className="mx-auto flex h-full w-full max-w-[1260px]">
        {/* Desktop: a permanent left-docked panel. It always shows the
            directory, and swaps to a briefing (with its own close button) when
            a flag is picked. Phones use the bottom sheets below instead. */}
        <aside className="hidden h-full w-[360px] shrink-0 flex-col overflow-hidden border-r-2 border-outline bg-white lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {active ? (
              <PinCard pin={active} bare onClose={() => setActiveId(null)} />
            ) : (
              directory
            )}
          </div>
        </aside>

        {/* Map region — fills the rest of the centered group, hugging the
            panel on its left so there's no gap between them. */}
        <div className="relative min-w-0 flex-1">
          <div className="relative h-full w-full">
          {/* Map surface — custom pan/pinch; native gestures off. */}
          <div
            ref={scrollRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`no-scrollbar h-full w-full touch-none overflow-auto ${
              plotMode ? "" : "cursor-grab active:cursor-grabbing"
            }`}
          >
            <div
              ref={contentRef}
              className="relative"
              style={{ width: `${scale * 100}%`, minWidth: "100%" }}
            >
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
                    onPointerDown={(e) => e.stopPropagation()}
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

          {/* Zoom HUD */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-2">
            <ZoomBtn label="+" onClick={() => setZoom(scaleRef.current + 0.5)} />
            <ZoomBtn label="−" onClick={() => setZoom(scaleRef.current - 0.5)} />
          </div>

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

          {!welcome && !active && (
            <button
              onClick={() => setWelcome(true)}
              className="absolute right-3 top-3 z-20 border-2 border-outline bg-white px-3 py-2 text-xs font-black uppercase text-primary shadow-brutal lg:hidden"
            >
              ⓘ Intel
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Mobile: draggable bottom sheets (hidden on desktop, which uses the
          left panel instead). */}
      <div className="lg:hidden">
        {welcome && (
          <BottomSheet onClose={() => setWelcome(false)}>
            <div className="mx-auto w-full max-w-3xl">{directory}</div>
          </BottomSheet>
        )}

        {active && (
          <BottomSheet key={active.id} onClose={() => setActiveId(null)}>
            <div className="mx-auto w-full max-w-3xl">
              <PinCard pin={active} bare />
            </div>
          </BottomSheet>
        )}
      </div>
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
