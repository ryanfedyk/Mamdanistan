"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAP_PINS, CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { PinCard } from "@/components/map/PinCard";
import type { MapPin, WinCategory } from "@/lib/types";

/**
 * MobileMap — full-screen, page-locked map (<lg only). Google-Maps-style:
 * - custom one-finger pan + two-finger pinch-zoom on the map only (so the
 *   floating UI never scales);
 * - draggable bottom sheets (drag the handle to resize, drag down to dismiss);
 * - interacting with the map dismisses an open sheet;
 * - opening a sheet centers the chosen pin in the band above it.
 */
const MAP_SRC = "/map-nyc.webp";
const IMG_W = 1536;
const IMG_H = 2752;
const ASPECT = IMG_H / IMG_W;
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const PEEK = 0.5; // default sheet height (fraction of the map area)

const LEGEND: Array<{ cat: WinCategory; label: string }> = [
  { cat: "pools", label: "Pools" },
  { cat: "infrastructure", label: "Infra" },
  { cat: "housing", label: "Housing" },
  { cat: "transit", label: "Transit" },
];

type Pointers = Map<number, { x: number; y: number }>;
type Gesture =
  | { mode: "pan"; lastX: number; lastY: number }
  | { mode: "pinch"; dist: number; scale: number; fracX: number; fracY: number }
  | null;

export function MobileMap() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(true);
  const [scale, setScale] = useState(1.6);
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
    const visibleH = ch * (1 - PEEK);
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

  return (
    <div className="fixed inset-x-0 bottom-0 top-[60px] z-40 bg-secondary lg:hidden">
      {/* Map surface — custom pan/pinch; native gestures off. */}
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="h-full w-full touch-none overflow-auto"
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
          className="absolute right-3 top-3 z-20 border-2 border-outline bg-white px-3 py-2 text-xs font-black uppercase text-primary shadow-brutal"
        >
          ⓘ Intel
        </button>
      )}

      {/* Welcome / directory sheet */}
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

      {/* Pin detail sheet */}
      {active && (
        <BottomSheet key={active.id} onClose={() => setActiveId(null)}>
          <PinCard pin={active} bare />
        </BottomSheet>
      )}
    </div>
  );
}

const FULL = 0.92;
const DISMISS = 0.26;

/**
 * Draggable bottom sheet. Drag the handle to resize; tap it to toggle
 * peek/full. Swiping up on the body expands the sheet first and only
 * scrolls the content once it's fully open (Google-Maps behaviour);
 * swiping the body down while it's scrolled to the top collapses it.
 */
function BottomSheet({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const [frac, setFrac] = useState(PEEK);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    y: number;
    frac: number;
    avail: number;
    moved: boolean;
    active: boolean;
    /** "resize" always drives height; "scroll" defers to native content
        scrolling; "maybe" resizes only once the finger moves down. */
    mode: "resize" | "scroll" | "maybe";
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const isFull = frac >= FULL - 0.005;

  const begin = (e: React.PointerEvent, source: "handle" | "body") => {
    const avail = ref.current?.parentElement?.clientHeight ?? window.innerHeight;
    const atTop = (bodyRef.current?.scrollTop ?? 0) <= 0;
    const mode: "resize" | "scroll" | "maybe" =
      source === "handle" || !isFull ? "resize" : atTop ? "maybe" : "scroll";
    drag.current = { y: e.clientY, frac, avail, moved: false, active: false, mode };
    if (source === "handle") e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.y - e.clientY; // up is positive
    if (Math.abs(dy) > 6) d.moved = true;
    if (d.mode === "scroll") return; // let the body scroll natively
    if (d.mode === "maybe") {
      if (dy < 0) d.mode = "resize"; // dragging down at the top → collapse
      else return; // dragging up while open → native scroll
    }
    d.active = true;
    if (!dragging) setDragging(true);
    setFrac(Math.max(0.14, Math.min(FULL, +(d.frac + dy / d.avail).toFixed(3))));
  };

  const end = (source: "handle" | "body") => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;
    if (source === "handle" && !d.moved) {
      setFrac((f) => (f >= FULL - 0.05 ? PEEK : FULL));
      return;
    }
    if (!d.active) return; // a tap or a native scroll — leave height alone
    setFrac((f) => {
      if (f < DISMISS) {
        onClose();
        return PEEK;
      }
      return f < (PEEK + FULL) / 2 ? PEEK : FULL;
    });
  };

  return (
    <div
      ref={ref}
      style={{ height: `${frac * 100}%` }}
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col border-t-4 border-outline bg-surface shadow-[0_-6px_0_0_#000] ${
        dragging ? "" : "transition-[height] duration-200"
      }`}
    >
      <div
        onPointerDown={(e) => begin(e, "handle")}
        onPointerMove={move}
        onPointerUp={() => end("handle")}
        onPointerCancel={() => end("handle")}
        className="flex touch-none items-center gap-2 border-b-2 border-outline px-2 py-1"
      >
        <span className="pointer-events-none flex flex-1 justify-center py-2">
          <span className="h-1.5 w-12 rounded-full bg-outline/40" />
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label="Close"
          className="grid h-7 w-7 shrink-0 place-items-center border-2 border-outline bg-white font-black text-black"
        >
          ✕
        </button>
      </div>
      <div
        ref={bodyRef}
        onPointerDown={(e) => begin(e, "body")}
        onPointerMove={move}
        onPointerUp={() => end("body")}
        onPointerCancel={() => end("body")}
        className={`min-h-0 flex-1 overscroll-contain ${
          isFull ? "overflow-auto" : "overflow-hidden"
        }`}
        // While dragging, suppress native scroll so the resize gesture wins;
        // once open and settled, allow vertical content scrolling.
        style={{ touchAction: isFull && !dragging ? "pan-y" : "none" }}
      >
        {children}
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
