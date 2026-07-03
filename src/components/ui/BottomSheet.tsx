"use client";

import { useRef, useState } from "react";

/**
 * Draggable bottom sheet with snap points (peek / full) and swipe-to-dismiss.
 *
 * Gestures are fully hand-driven (touch-action: none), so nothing fights the
 * browser's native scroll:
 * - Drag up from peek → the sheet grows toward full.
 * - Once full, dragging scrolls the content (with a little release momentum).
 * - Drag down while the content is scrolled to the top → the sheet shrinks
 *   (full → peek), and dragging down again pulls it past the dismiss line to
 *   close. A flick throws it to the next snap.
 * - Tap the grip to toggle peek/full; the ✕ always closes.
 *
 * Shared by the tactical map (`variant="map"`) and the arcade (`variant="arcade"`).
 */
const FULL = 0.92;
const MIN = 0.14;
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

type Drag = {
  y0: number; // pointer y at grab
  y: number; // last pointer y
  t: number; // last event time (for velocity)
  vy: number; // px/ms, down-positive
  frac0: number; // sheet fraction at grab
  scroll0: number; // content scrollTop at grab
  avail: number; // px height the fraction maps onto
  onHandle: boolean;
  moved: boolean;
  mode: "idle" | "sheet" | "scroll";
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
  const fracRef = useRef(frac);
  fracRef.current = frac;

  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const momentum = useRef<number>(0);
  const movedRef = useRef(false); // swallow the click that follows a real drag
  const s = STYLES[variant];

  const setF = (f: number) => {
    const c = Math.max(MIN, Math.min(FULL, +f.toFixed(4)));
    fracRef.current = c;
    setFrac(c);
  };

  // Fling the content on release when the drag was scrolling it.
  const flingScroll = (vy: number) => {
    const el = bodyRef.current;
    if (!el) return;
    let sv = -vy; // finger up (vy<0) → keep scrolling down
    if (Math.abs(sv) < 0.06) return;
    let prev: number | null = null;
    const step = (t: number) => {
      if (drag.current || prev === null) {
        prev = t;
        if (drag.current) return; // a new grab cancels the fling
      }
      const dt = t - prev;
      prev = t;
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = Math.max(0, Math.min(max, el.scrollTop + sv * dt));
      sv *= Math.pow(0.95, dt / 16);
      if (Math.abs(sv) > 0.02 && el.scrollTop > 0 && el.scrollTop < max) {
        momentum.current = requestAnimationFrame(step);
      }
    };
    momentum.current = requestAnimationFrame(step);
  };

  const begin = (e: React.PointerEvent, source: "handle" | "body") => {
    cancelAnimationFrame(momentum.current);
    movedRef.current = false;
    const avail =
      (ref.current?.offsetParent as HTMLElement | null)?.clientHeight ??
      window.innerHeight;
    drag.current = {
      y0: e.clientY,
      y: e.clientY,
      t: e.timeStamp,
      vy: 0,
      frac0: fracRef.current,
      scroll0: bodyRef.current?.scrollTop ?? 0,
      avail,
      onHandle: source === "handle",
      moved: false,
      mode: "idle",
    };
    // Capture on the drag surface itself (not the child under the finger) so a
    // drag never turns into a click on an inner button.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  // A drag that moved must not also fire a click on an inner link/button.
  const swallowClick = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const y = e.clientY;
    const dt = Math.max(1, e.timeStamp - d.t);
    d.vy = (y - d.y) / dt;
    const totalDy = y - d.y0; // down-positive
    if (Math.abs(totalDy) > 3) d.moved = true;

    if (d.mode === "idle") {
      if (Math.abs(totalDy) < 4) {
        d.y = y;
        d.t = e.timeStamp;
        return;
      }
      const full = d.frac0 >= FULL - 0.005;
      if (d.onHandle || !full) d.mode = "sheet";
      else if (d.scroll0 <= 0 && totalDy > 0) d.mode = "sheet"; // at top, pulling down
      else d.mode = "scroll";
    }

    if (d.mode === "sheet") {
      if (!dragging) setDragging(true);
      setF(d.frac0 - totalDy / d.avail);
    } else {
      const el = bodyRef.current!;
      const max = el.scrollHeight - el.clientHeight;
      let next = d.scroll0 - totalDy; // finger up → scroll down
      if (next <= 0 && totalDy > 0) {
        // Reached the top while pulling down → hand off to shrinking the sheet.
        el.scrollTop = 0;
        d.mode = "sheet";
        d.frac0 = fracRef.current;
        d.scroll0 = 0;
        d.y0 = y;
        if (!dragging) setDragging(true);
      } else {
        el.scrollTop = Math.max(0, Math.min(max, next));
      }
    }
    d.y = y;
    d.t = e.timeStamp;
  };

  const end = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) movedRef.current = true;

    if (d.mode === "sheet") {
      setDragging(false);
      // Snap to a neighbouring stop only — a flick can't skip a snap, so pulling
      // down from full lands on peek first and only a second pull dismisses.
      const cur = fracRef.current;
      const snaps = [0, peek, FULL];
      const lower = Math.max(...snaps.filter((x) => x <= cur + 0.001), 0);
      const upper = Math.min(...snaps.filter((x) => x >= cur - 0.001), FULL);
      const FLICK = 0.4; // px/ms
      let target: number;
      if (d.vy > FLICK) target = lower; // flung down
      else if (d.vy < -FLICK) target = upper; // flung up
      else target = cur - lower < upper - cur ? lower : upper; // nearest
      if (target <= 0.02) onClose();
      else setF(target);
    } else if (d.mode === "scroll") {
      flingScroll(d.vy);
    } else if (d.onHandle && !d.moved) {
      // Tap on the grip toggles peek/full.
      setF(fracRef.current >= FULL - 0.05 ? peek : FULL);
    }
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
        onPointerUp={end}
        onPointerCancel={end}
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
        onPointerUp={end}
        onPointerCancel={end}
        onClickCapture={swallowClick}
        className="min-h-0 flex-1 touch-none overflow-y-auto overscroll-contain"
      >
        {children}
      </div>
    </div>
  );
}
