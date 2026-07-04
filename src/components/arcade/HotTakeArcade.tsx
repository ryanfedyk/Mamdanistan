"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  INTERVIEW_QUESTIONS,
  INTERVIEW_START,
  NOISE_MAX,
  DELTAS,
  type AnswerType,
  type InterviewOption,
} from "@/data/interview";

/**
 * "HOT TAKE" — a tall, mobile-first broadcast set. The Mayor sits behind the
 * news desk and animates on KEY MOMENTS rather than looping constantly: each
 * state change plays a short burst of frames and then settles on a hold pose,
 * with an occasional idle shift so he stays alive without a steady drumbeat.
 *
 * The interview logic (questions, Momentum vs Noise) is shared with
 * @/data/interview; answer order is shuffled per question so the on-message
 * pick isn't always the first button.
 */

/* ---- Mayor pose scripts ----------------------------------------------- *
 * Every game beat has ONE deliberate script: a short entry sequence that ends
 * on a hold pose. While holding, the only motion is an occasional BLINK — a
 * brief swap that always returns to the hold pose — so he reads as alive but
 * composed, never wandering between poses.
 *
 * Frame vocabulary (sliced from the sheet):
 *   neutral        plain front — the resting anchor face
 *   listen_0..3    attentive close-ups: front / tilt / eyes-closed / glance
 *   smiling_0..3   warm close-ups: soft / big grin / bright / wry
 *   speak_0..5     talking mouth-cycle
 *   think_0..2     "well…" point / hand-on-chin / chin-stroke
 *   speakgest_0..3 explaining palms / point / open gesture / thumbs-up
 *   commgest_0..3  angry point-down / lecture finger / palm-out / shrug
 */
/** Cache-buster for the set's art. Bump when any sprite/bg file is re-cut so
 *  clients don't keep serving stale cached copies under the same filenames. */
const ASSET_V = 2;
const F = (n: string) => `/sprites/hot-take/${n}.webp?v=${ASSET_V}`;

interface Step {
  f: string;
  ms: number; // time before advancing; the last step is the hold (ms ignored)
}
interface Blink {
  f: string; // brief swap frame
  ms: number; // how long the blink shows
  min: number; // min/max gap between blinks
  max: number;
}
interface PoseScript {
  seq: Step[];
  blink?: Blink;
}

type ScriptKey =
  | "attract"
  | "asking"
  | "react_message"
  | "react_dodge"
  | "react_trap"
  | "won"
  | "gameover";

const SCRIPTS: Record<ScriptKey, PoseScript> = {
  // Waiting for air: composed, occasional blink.
  attract: {
    seq: [{ f: "neutral", ms: 0 }],
    blink: { f: "listen_2", ms: 260, min: 3800, max: 6800 },
  },
  // The press is asking: a small attentive turn, then settle front and listen.
  asking: {
    seq: [
      { f: "listen_1", ms: 520 },
      { f: "listen_0", ms: 0 },
    ],
    blink: { f: "listen_2", ms: 260, min: 3200, max: 6200 },
  },
  // He answers — talks first (mouth cycle), then lands the tone.
  react_message: {
    seq: [
      { f: "speak_1", ms: 240 },
      { f: "speak_2", ms: 240 },
      { f: "speak_4", ms: 240 },
      { f: "speak_5", ms: 280 },
      { f: "speakgest_2", ms: 460 }, // open, confident gesture…
      { f: "speakgest_3", ms: 0 }, // …lands on the thumbs-up
    ],
  },
  react_dodge: {
    seq: [
      { f: "speak_3", ms: 260 },
      { f: "speak_0", ms: 260 },
      { f: "speak_3", ms: 300 }, // the answer trails off…
      { f: "think_2", ms: 480 },
      { f: "think_1", ms: 0 }, // …hand settles on the chin
    ],
  },
  react_trap: {
    seq: [
      { f: "speak_1", ms: 200 },
      { f: "speak_2", ms: 200 },
      { f: "speak_1", ms: 200 }, // talking faster…
      { f: "commgest_3", ms: 440 }, // …shrug —
      { f: "commgest_0", ms: 0 }, // — and the angry point. He's the story.
    ],
  },
  // Walked the gauntlet: the smile builds, then holds with a soft blink.
  won: {
    seq: [
      { f: "smiling_2", ms: 500 },
      { f: "smiling_1", ms: 0 },
    ],
    blink: { f: "smiling_0", ms: 300, min: 4000, max: 7000 },
  },
  // Became the story: palm-out, then fuming — dead still.
  gameover: {
    seq: [
      { f: "commgest_2", ms: 500 },
      { f: "commgest_0", ms: 0 },
    ],
  },
};

const ALL_FRAMES = Array.from(
  new Set(
    Object.values(SCRIPTS).flatMap((s) => [
      ...s.seq.map((x) => x.f),
      ...(s.blink ? [s.blink.f] : []),
    ]),
  ),
);

/* ---- Game state ------------------------------------------------------ */
type Phase = "attract" | "asking" | "reacting" | "won" | "gameover";
interface State {
  phase: Phase;
  index: number;
  momentum: number;
  noise: number;
  onMessage: number;
  reaction: InterviewOption | null;
  failReason: string | null;
  /** Shuffled option order for the current question. */
  order: number[];
}

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const START: State = {
  phase: "attract",
  index: 0,
  momentum: INTERVIEW_START.momentum,
  noise: INTERVIEW_START.noise,
  onMessage: 0,
  reaction: null,
  failReason: null,
  order: [0, 1, 2],
};
const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** The set's aspect ratio (the uploaded background). */
const STAGE_AR = 789 / 1402;
/** Where the Mayor's sprite starts, as a fraction of stage height. */
const MAYOR_TOP = 0.094;
/** Keep the Mayor's sprite top at/below this box offset (under the HUD). */
const SAFE_TOP = 72;
/** Pull-to-refresh: distance (px) the finger must travel. */
const PTR_THRESHOLD = 110;

export function HotTakeArcade() {
  const [s, setS] = useState<State>(START);
  const q = INTERVIEW_QUESTIONS[s.index];

  // The stage is width-fit and pushed as far DOWN as the composition allows:
  // bottom-anchored (desk at the bottom, dark strip up top on tall phones),
  // but never so far up that the Mayor's head slides under the HUD — on short
  // boxes the set slides down instead (the bottom of the desk front crops
  // behind the question panel), so his seated torso always shows above the
  // desk. Keeping the set's aspect means % anchors (sprite, mic, desk line)
  // always match the background art.
  const boxRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0, top: 0 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const sh = w / STAGE_AR;
      const top = Math.max(h - sh, SAFE_TOP - MAYOR_TOP * sh);
      setStage({ w, h: sh, top });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Custom pull-to-refresh: the scroll lock disables the browser's native
  // gesture, so a long downward pull on the set reloads the page ourselves.
  const [pull, setPull] = useState(0);
  const pullY0 = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    pullY0.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (pullY0.current === null) return;
    const dy = e.touches[0].clientY - pullY0.current;
    setPull(dy > 12 ? dy : 0);
  };
  const onTouchEnd = () => {
    if (pull >= PTR_THRESHOLD) window.location.reload();
    pullY0.current = null;
    setPull(0);
  };

  // Preload every frame once so poses don't pop in mid-answer.
  useEffect(() => {
    ALL_FRAMES.forEach((n) => {
      const img = new Image();
      img.src = F(n);
    });
  }, []);

  // On mobile the game is a fixed full-window layer — lock the document scroll
  // behind it so the page behaves like a fixed-size app screen.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      const v = mq.matches ? "hidden" : "";
      document.documentElement.style.overflow = v;
      document.body.style.overflow = v;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const begin = () =>
    setS({ ...START, phase: "asking", order: shuffled(INTERVIEW_QUESTIONS[0].options.length) });

  const choose = (opt: InterviewOption) => {
    const d = DELTAS[opt.type];
    setS((p) => ({
      ...p,
      phase: "reacting",
      momentum: clamp(p.momentum + d.momentum),
      noise: clamp(p.noise + d.noise),
      reaction: opt,
      onMessage: p.onMessage + (opt.type === "message" ? 1 : 0),
    }));
  };

  const next = () => {
    setS((p) => {
      if (p.noise >= NOISE_MAX)
        return { ...p, phase: "gameover", failReason: "The Noise swallowed the message — you became the story." };
      if (p.momentum <= 0)
        return { ...p, phase: "gameover", failReason: "Momentum flatlined — the room stopped listening." };
      if (p.index + 1 >= INTERVIEW_QUESTIONS.length) return { ...p, phase: "won" };
      return {
        ...p,
        phase: "asking",
        index: p.index + 1,
        reaction: null,
        order: shuffled(INTERVIEW_QUESTIONS[p.index + 1].options.length),
      };
    });
  };

  const options = useMemo(
    () => s.order.map((i) => q.options[i]).filter(Boolean),
    [s.order, q],
  );

  // Pick the Mayor's pose script from the game beat.
  const script: ScriptKey =
    s.phase === "attract"
      ? "attract"
      : s.phase === "asking"
        ? "asking"
        : s.phase === "reacting"
          ? (`react_${s.reaction?.type ?? "dodge"}` as ScriptKey)
          : s.phase === "won"
            ? "won"
            : "gameover";

  return (
    // Mobile (<lg): a fixed, non-scrollable full-window layer, like Fix the
    // City. Desktop (lg+): a centered tall card. The set visuals live on an
    // aspect-locked STAGE that covers the box (measured below), so the
    // sprite/mic/desk anchors always line up with the background art no matter
    // the phone's aspect; the HUD and question UI pin to the real box edges.
    <div
      ref={boxRef}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className="fixed inset-x-0 bottom-0 top-[60px] z-40 select-none overflow-hidden bg-mamdani-ink [-webkit-touch-callout:none] lg:relative lg:inset-auto lg:top-auto lg:z-auto lg:mx-auto lg:aspect-[789/1402] lg:w-full lg:max-w-[400px] lg:rounded-lg lg:border-2 lg:border-black lg:shadow-brutal"
    >
      {/* Stage: background + Mayor + foreground desk/mic, in set coordinates */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ width: stage.w, height: stage.h, top: stage.top }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/games/hot-take-bg.webp?v=${ASSET_V}`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full"
        />

        {/* The Mayor, seated on the chair, face at the mic's aim line */}
        <MayorSprite script={script} />

        {/* Foreground desk (clipped copy of the set) hides his lower torso… */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/games/hot-take-bg.webp?v=${ASSET_V}`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ clipPath: "inset(46% 0 0 0)" }}
        />
        {/* …and the desk mic sits in front of him */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/sprites/hot-take/mic_fg.webp?v=${ASSET_V}`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-[34%] top-[35%] w-[16%]"
        />
      </div>

      {/* Faint scanline/CRT vibe */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.18)_0px,rgba(0,0,0,0.18)_1px,transparent_2px,transparent_3px)] opacity-40" />

      {/* Pull-to-refresh indicator (custom — the scroll lock disables native) */}
      {pull > 30 && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-10 flex justify-center">
          <span
            className={`rounded-full border-2 border-black px-3 py-1 font-pixel text-[9px] uppercase shadow-pixel ${
              pull >= PTR_THRESHOLD ? "bg-mamdani-mint text-mamdani-ink" : "bg-mamdani-slate text-mamdani-fog"
            }`}
          >
            {pull >= PTR_THRESHOLD ? "↻ Release to refresh" : "↓ Pull to refresh"}
          </span>
        </div>
      )}

      {/* Top HUD: meters + live badge */}
      <div className="absolute inset-x-0 top-0 space-y-1.5 bg-gradient-to-b from-black/70 to-transparent px-3 pb-4 pt-2">
        <div className="flex items-center justify-between font-pixel text-[8px] uppercase">
          <span className="flex items-center gap-1 text-mamdani-red">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-mamdani-red" /> On Air
          </span>
          <Link href="/arcade" className="text-mamdani-fog/80 hover:text-mamdani-cyan">
            ✕ Exit
          </Link>
        </div>
        <Meter label="Momentum" value={s.momentum} color="#3DDC97" warnLow />
        <Meter label="Noise" value={s.noise} color="#FF2E4D" />
      </div>

      {/* Bottom broadcast overlay: question + options / reaction / results */}
      <div className="absolute inset-x-0 bottom-0 flex max-h-[62%] flex-col justify-end gap-2 bg-gradient-to-t from-black via-black/85 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10">
        {s.phase === "attract" && <Attract onStart={begin} />}

        {(s.phase === "asking" || s.phase === "reacting") && (
          <>
            {/* News chyron: the reporter's question */}
            <div className="border-l-4 border-mamdani-cyan bg-black/70 px-3 py-2">
              <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
                Q{s.index + 1}/{INTERVIEW_QUESTIONS.length} · {q.topic} · The Press
              </p>
              <p className="mt-1 font-sans text-[15px] font-semibold leading-snug text-white">🎙 {q.prompt}</p>
            </div>

            {s.phase === "asking" ? (
              <div className="space-y-1.5 overflow-y-auto">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => choose(opt)}
                    className="block w-full rounded-sm border-2 border-mamdani-steel bg-mamdani-ink/95 px-3 py-2.5 text-left font-sans text-[14px] font-medium leading-snug text-white/95 transition-colors hover:border-mamdani-cyan hover:text-white active:translate-y-[1px]"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            ) : (
              <Reaction reaction={s.reaction!} onNext={next} last={s.index + 1 >= INTERVIEW_QUESTIONS.length} />
            )}
          </>
        )}

        {(s.phase === "won" || s.phase === "gameover") && (
          <Results state={s} onAgain={begin} />
        )}
      </div>
    </div>
  );
}

/* ---- The animated Mayor ---------------------------------------------- *
 * Runs the beat's pose script: step through the entry sequence once, then
 * hold the final pose. While holding, an occasional blink swaps briefly and
 * ALWAYS returns to the hold pose — alive, but composed.
 *
 * Placement is anchored to the set: seated on the chair (center-x 62%), face
 * at the microphone's aim line, torso disappearing behind the desk edge (the
 * clipped set copy the parent draws at 46%). */
function MayorSprite({ script }: { script: ScriptKey }) {
  const [frame, setFrame] = useState(SCRIPTS[script].seq[0].f);

  useEffect(() => {
    const { seq, blink } = SCRIPTS[script];
    let alive = true;
    const timers: number[] = [];
    let t = 0;
    seq.forEach((step) => {
      timers.push(window.setTimeout(() => alive && setFrame(step.f), t));
      t += step.ms;
    });
    if (blink) {
      const hold = seq[seq.length - 1].f;
      const gap = () => blink.min + Math.random() * (blink.max - blink.min);
      const schedule = (delay: number) => {
        timers.push(
          window.setTimeout(() => {
            if (!alive) return;
            setFrame(blink.f);
            timers.push(
              window.setTimeout(() => {
                if (!alive) return;
                setFrame(hold);
                schedule(gap());
              }, blink.ms),
            );
          }, delay),
        );
      };
      schedule(t + gap());
    }
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [script]);

  return (
    <div
      className="absolute left-[62%] w-[72%] -translate-x-1/2"
      style={{ top: `${MAYOR_TOP * 100}%` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={F(frame)}
        alt="Mayor Mamdani at the news desk"
        draggable={false}
        className="pointer-events-none h-auto w-full"
      />
    </div>
  );
}

/* ---- UI bits --------------------------------------------------------- */
function Attract({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-2 rounded-sm border-2 border-mamdani-steel bg-black/75 px-4 py-4">
      <h2 className="pixel-heading text-base text-mamdani-cyan">Hot Take</h2>
      <p className="font-sans text-[14px] leading-relaxed text-white/90">
        Eight questions. A hostile press corps wants you to be the headline. Stay on message — pivot
        every trap back to pools, rent, and buses. Take the bait and the{" "}
        <span className="text-mamdani-red">Noise</span> buries you.
      </p>
      <button
        onClick={onStart}
        className="min-h-[46px] w-full rounded-sm border-2 border-black bg-mamdani-gold px-4 font-pixel text-[10px] uppercase text-mamdani-ink shadow-pixel active:translate-y-[2px] active:shadow-none"
      >
        ▶ Step up to the mic
      </button>
    </div>
  );
}

const TONE: Record<AnswerType, { label: string; cls: string }> = {
  message: { label: "On Message", cls: "border-mamdani-mint text-mamdani-mint" },
  trap: { label: "Took The Bait", cls: "border-mamdani-red text-mamdani-red" },
  dodge: { label: "Dodged", cls: "border-mamdani-gold text-mamdani-gold" },
};

function Reaction({
  reaction,
  onNext,
  last,
}: {
  reaction: InterviewOption;
  onNext: () => void;
  last: boolean;
}) {
  const t = TONE[reaction.type];
  return (
    <div className="space-y-2">
      <div className={`rounded-sm border-2 bg-black/75 px-3 py-2 ${t.cls}`}>
        <p className="font-pixel text-[8px] uppercase">{t.label}</p>
        <p className="mt-1 font-sans text-[14px] font-medium leading-snug">{reaction.reaction}</p>
      </div>
      <button
        onClick={onNext}
        className="min-h-[46px] w-full rounded-sm border-2 border-black bg-mamdani-gold px-4 font-pixel text-[10px] uppercase text-mamdani-ink shadow-pixel active:translate-y-[2px] active:shadow-none"
      >
        {last ? "▸ Final tally" : "▸ Next question"}
      </button>
    </div>
  );
}

function Results({ state, onAgain }: { state: State; onAgain: () => void }) {
  const won = state.phase === "won";
  return (
    <div className="space-y-2 rounded-sm border-2 border-mamdani-steel bg-black/80 px-4 py-4">
      <h2 className={`pixel-heading text-base ${won ? "text-mamdani-mint" : "text-mamdani-red"}`}>
        {won ? "Stayed On Message" : "You Became The Story"}
      </h2>
      <p className="font-sans text-[14px] leading-relaxed text-white/90">
        {won
          ? "You walked the gauntlet and the pools are still the story. The discourse goes hungry."
          : state.failReason}
      </p>
      <div className="flex flex-wrap gap-3 font-pixel text-[9px] uppercase">
        <span className="text-mamdani-mint">Momentum {state.momentum}</span>
        <span className="text-mamdani-cyan">
          On-message {state.onMessage}/{INTERVIEW_QUESTIONS.length}
        </span>
      </div>
      <button
        onClick={onAgain}
        className="min-h-[46px] w-full rounded-sm border-2 border-black bg-mamdani-gold px-4 font-pixel text-[10px] uppercase text-mamdani-ink shadow-pixel active:translate-y-[2px] active:shadow-none"
      >
        ↺ Run it back
      </button>
    </div>
  );
}

function Meter({
  label,
  value,
  color,
  warnLow = false,
}: {
  label: string;
  value: number;
  color: string;
  warnLow?: boolean;
}) {
  const danger = warnLow ? value <= 20 : value >= 80;
  return (
    <div>
      <div className="mb-0.5 flex justify-between font-pixel text-[7px] uppercase text-white/90">
        <span>{label}</span>
        <span style={{ color: danger ? "#FF2E4D" : color }}>{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-black/60 bg-black/50">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
