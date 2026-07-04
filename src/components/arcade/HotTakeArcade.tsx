"use client";

import { useEffect, useMemo, useState } from "react";
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

/* ---- Mayor animation clips ------------------------------------------- */
const F = (n: string) => `/sprites/hot-take/${n}.webp`;
type ClipName =
  | "listen"
  | "think"
  | "speakgest"
  | "smiling"
  | "commgest";

/** play: burst shown once on entering the state (ends on the hold pose).
 *  step: ms per burst frame. idle: pool for the occasional resting shift. */
const CLIPS: Record<ClipName, { play: string[]; step: number; idle: string[] }> = {
  // The press is asking — glance around, settle front and hold.
  listen: {
    play: ["listen_1", "listen_3", "listen_0"],
    step: 520,
    idle: ["listen_0", "listen_1", "listen_2", "listen_3"],
  },
  // Non-committal dodge — hand comes up to the chin and stays there.
  think: {
    play: ["think_0", "think_2", "think_1"],
    step: 480,
    idle: ["think_1", "think_2"],
  },
  // On-message answer — confident talking gestures, ends on the thumbs-up.
  speakgest: {
    play: ["speakgest_0", "speakgest_1", "speakgest_2", "speakgest_3"],
    step: 420,
    idle: ["speakgest_3", "speak_5"],
  },
  // Intro / victory — warm and settled.
  smiling: {
    play: ["smiling_2", "smiling_1"],
    step: 520,
    idle: ["smiling_0", "smiling_1", "smiling_2", "smiling_3"],
  },
  // Took the bait / gameover — blows up, ends pointing at the desk.
  commgest: {
    play: ["commgest_2", "commgest_3", "commgest_1", "commgest_0"],
    step: 420,
    idle: ["commgest_0", "commgest_1"],
  },
};
const ALL_FRAMES = Array.from(
  new Set(Object.values(CLIPS).flatMap((c) => [...c.play, ...c.idle])),
);

/** Which pose the Mayor strikes for a given answer type. */
const REACTION_CLIP: Record<AnswerType, ClipName> = {
  message: "speakgest", // confident, on-message gesture
  dodge: "think", // non-committal, mulling it over
  trap: "commgest", // blew up — became the story
};

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

export function HotTakeArcade() {
  const [s, setS] = useState<State>(START);
  const q = INTERVIEW_QUESTIONS[s.index];

  // Preload every frame once so poses don't pop in mid-answer.
  useEffect(() => {
    ALL_FRAMES.forEach((n) => {
      const img = new Image();
      img.src = F(n);
    });
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

  // Pick the Mayor's current animation from the game state.
  const clip: ClipName =
    s.phase === "attract"
      ? "smiling"
      : s.phase === "asking"
        ? "listen"
        : s.phase === "reacting"
          ? REACTION_CLIP[s.reaction?.type ?? "dodge"]
          : s.phase === "won"
            ? "smiling"
            : "commgest";

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative mx-auto aspect-[704/1261] w-full max-w-[440px] select-none overflow-hidden rounded-lg border-2 border-black bg-mamdani-ink shadow-brutal [-webkit-touch-callout:none]"
      style={{ maxHeight: "calc(100dvh - 84px)" }}
    >
      {/* Studio background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/games/hot-take-bg.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* The Mayor, seated behind the desk */}
      <MayorSprite clip={clip} />

      {/* Foreground desk: a clipped copy of the set so his torso sits behind it */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/games/hot-take-bg.webp"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: "inset(64% 0 0 0)" }}
      />

      {/* Faint scanline/CRT vibe */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.18)_0px,rgba(0,0,0,0.18)_1px,transparent_2px,transparent_3px)] opacity-40" />

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
      <div className="absolute inset-x-0 bottom-0 flex max-h-[62%] flex-col justify-end gap-2 bg-gradient-to-t from-black via-black/85 to-transparent px-3 pb-3 pt-10">
        {s.phase === "attract" && <Attract onStart={begin} />}

        {(s.phase === "asking" || s.phase === "reacting") && (
          <>
            {/* News chyron: the reporter's question */}
            <div className="border-l-4 border-mamdani-cyan bg-black/70 px-3 py-2">
              <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
                Q{s.index + 1}/{INTERVIEW_QUESTIONS.length} · {q.topic} · The Press
              </p>
              <p className="mt-1 font-terminal text-lg leading-tight text-white">🎙 {q.prompt}</p>
            </div>

            {s.phase === "asking" ? (
              <div className="space-y-1.5 overflow-y-auto">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => choose(opt)}
                    className="block w-full rounded-sm border-2 border-mamdani-steel bg-mamdani-slate/80 px-3 py-2 text-left font-terminal text-base leading-snug text-mamdani-fog transition-colors hover:border-mamdani-cyan hover:text-white active:translate-y-[1px]"
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
 * On each state change: play the clip's burst once (step ms per frame) and
 * hold the final pose. After settling, shift to a random idle pose every
 * 3.5–6.5s — a blink of life, not a loop. */
function MayorSprite({ clip }: { clip: ClipName }) {
  const [frame, setFrame] = useState(CLIPS[clip].play[0]);

  useEffect(() => {
    const { play, step, idle } = CLIPS[clip];
    let alive = true;
    const timers: number[] = [];
    play.forEach((f, i) => {
      timers.push(window.setTimeout(() => alive && setFrame(f), i * step));
    });
    const scheduleIdle = (delay: number) => {
      timers.push(
        window.setTimeout(() => {
          if (!alive) return;
          setFrame(idle[Math.floor(Math.random() * idle.length)]);
          scheduleIdle(3500 + Math.random() * 3000);
        }, delay),
      );
    };
    scheduleIdle(play.length * step + 3500 + Math.random() * 3000);
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [clip]);

  return (
    <div className="absolute left-1/2 top-[27%] w-[64%] -translate-x-1/2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={F(frame)}
        alt="Mayor Mamdani at the news desk"
        draggable={false}
        className="pointer-events-none h-auto w-full drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]"
      />
    </div>
  );
}

/* ---- UI bits --------------------------------------------------------- */
function Attract({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-2 rounded-sm border-2 border-mamdani-steel bg-black/75 px-4 py-4">
      <h2 className="pixel-heading text-base text-mamdani-cyan">Hot Take</h2>
      <p className="font-terminal text-base leading-snug text-mamdani-fog">
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
        <p className="mt-1 font-terminal text-base leading-snug">{reaction.reaction}</p>
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
      <p className="font-terminal text-base leading-snug text-mamdani-fog">
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
