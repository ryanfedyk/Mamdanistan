"use client";

import { useRef, useState } from "react";

/**
 * Draggable bottom sheet (Google-Maps behaviour). Drag the handle to resize;
 * tap it to toggle peek/full. Swiping up on the body expands the sheet first
 * and only scrolls the content once it's fully open; swiping the body down
 * while it's scrolled to the top collapses it. Drag below the dismiss line to
 * close.
 *
 * Shared by the tactical map (`variant="map"`, neo-brutalist) and the arcade
 * cabinets (`variant="arcade"`, dark 16-bit skin).
 */
const FULL = 0.92;
const DISMISS = 0.26;
const DEFAULT_PEEK = 0.5;

type Variant = "map" | "arcade";

const STYLES: Record<Variant, { panel: string; header: string; grip: string; close: string }> = {
  map: {
    panel: "border-t-4 border-outline bg-surface shadow-[0_-6px_0_0_#000]",
    header: "border-b-2 border-outline",
    grip: "bg-outline/40",
    close: "border-2 border-outline bg-white font-black text-black",
  },
  arcade: {
    panel: "border-t-2 border-mamdani-steel bg-mamdani-slate shadow-[0_-6px_0_0_#000]",
    header: "border-b-2 border-mamdani-steel/60",
    grip: "bg-mamdani-fog/40",
    close: "border-2 border-mamdani-steel bg-mamdani-ink/70 font-pixel text-[10px] text-mamdani-fog",
  },
};

export function BottomSheet({
  children,
  onClose,
  variant = "map",
  peek = DEFAULT_PEEK,
}: {
  children: React.ReactNode;
  onClose: () => void;
  variant?: Variant;
  peek?: number;
}) {
  const [frac, setFrac] = useState(peek);
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
  const s = STYLES[variant];

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
      setFrac((f) => (f >= FULL - 0.05 ? peek : FULL));
      return;
    }
    if (!d.active) return; // a tap or a native scroll — leave height alone
    setFrac((f) => {
      if (f < DISMISS) {
        onClose();
        return peek;
      }
      return f < (peek + FULL) / 2 ? peek : FULL;
    });
  };

  return (
    <div
      ref={ref}
      style={{ height: `${frac * 100}%` }}
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col ${s.panel} ${
        dragging ? "" : "transition-[height] duration-200"
      }`}
    >
      <div
        onPointerDown={(e) => begin(e, "handle")}
        onPointerMove={move}
        onPointerUp={() => end("handle")}
        onPointerCancel={() => end("handle")}
        className={`flex touch-none items-center gap-2 px-2 py-1 ${s.header}`}
      >
        <span className="pointer-events-none flex flex-1 justify-center py-2">
          <span className={`h-1.5 w-12 rounded-full ${s.grip}`} />
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label="Close"
          className={`grid h-7 w-7 shrink-0 place-items-center ${s.close}`}
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
        style={{ touchAction: isFull && !dragging ? "pan-y" : "none" }}
      >
        {children}
      </div>
    </div>
  );
}
