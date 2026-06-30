"use client";

import { useState } from "react";
import {
  INTERVIEW_QUESTIONS,
  INTERVIEW_START,
  NOISE_MAX,
  DELTAS,
  type InterviewOption,
} from "@/data/interview";

type Phase = "attract" | "asking" | "reacting" | "won" | "gameover";

interface State {
  phase: Phase;
  index: number;
  momentum: number;
  noise: number;
  onMessage: number;
  reaction: InterviewOption | null;
  failReason: string | null;
}

const START: State = {
  phase: "attract",
  index: 0,
  momentum: INTERVIEW_START.momentum,
  noise: INTERVIEW_START.noise,
  onMessage: 0,
  reaction: null,
  failReason: null,
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function InterviewGame() {
  const [s, setS] = useState<State>(START);
  const q = INTERVIEW_QUESTIONS[s.index];

  const choose = (opt: InterviewOption) => {
    const d = DELTAS[opt.type];
    const momentum = clamp(s.momentum + d.momentum);
    const noise = clamp(s.noise + d.noise);
    setS({
      ...s,
      phase: "reacting",
      momentum,
      noise,
      reaction: opt,
      onMessage: s.onMessage + (opt.type === "message" ? 1 : 0),
    });
  };

  const next = () => {
    if (s.noise >= NOISE_MAX)
      return setS({ ...s, phase: "gameover", failReason: "The noise swallowed the message — you became the story." });
    if (s.momentum <= 0)
      return setS({ ...s, phase: "gameover", failReason: "Momentum flatlined — the room stopped listening." });
    if (s.index + 1 >= INTERVIEW_QUESTIONS.length)
      return setS({ ...s, phase: "won" });
    setS({ ...s, phase: "asking", index: s.index + 1, reaction: null });
  };

  if (s.phase === "attract") {
    return (
      <Shell>
        <p className="font-terminal text-xl text-mamdani-fog">
          Eight questions. A hostile press corps trying to make you the
          headline. Stay on message — pivot every trap back to pools, rent, and
          buses. Take the bait and the <span className="text-mamdani-red">Noise</span> buries you.
        </p>
        <button onClick={() => setS({ ...START, phase: "asking" })} className={primaryBtn}>
          ▶ Step up to the mic
        </button>
      </Shell>
    );
  }

  if (s.phase === "won" || s.phase === "gameover") {
    const won = s.phase === "won";
    return (
      <Shell>
        <h2 className={`pixel-heading text-base ${won ? "text-mamdani-mint" : "text-mamdani-red"}`}>
          {won ? "Stayed On Message" : "You Became The Story"}
        </h2>
        <p className="font-terminal text-xl text-mamdani-fog">
          {won
            ? "You walked the gauntlet and the pools are still the story. The discourse goes hungry."
            : s.failReason}
        </p>
        <div className="flex flex-wrap gap-4 font-pixel text-[10px] uppercase">
          <span className="text-mamdani-mint">Momentum {s.momentum}</span>
          <span className="text-mamdani-cyan">On-message {s.onMessage}/{INTERVIEW_QUESTIONS.length}</span>
        </div>
        <button onClick={() => setS({ ...START, phase: "asking" })} className={primaryBtn}>
          ↺ Run it back
        </button>
      </Shell>
    );
  }

  // asking / reacting
  return (
    <Shell>
      <div className="space-y-2">
        <Meter label="Momentum" value={s.momentum} color="#3DDC97" warnLow />
        <Meter label="Noise" value={s.noise} color="#FF2E4D" />
      </div>

      <div className="border-2 border-mamdani-steel bg-mamdani-ink/60 px-4 py-3">
        <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
          Q{s.index + 1}/{INTERVIEW_QUESTIONS.length} · {q.topic}
        </p>
        <p className="mt-2 font-terminal text-2xl leading-tight text-white">
          🎙️ {q.prompt}
        </p>
      </div>

      {s.phase === "asking" ? (
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(opt)}
              className="block w-full border-2 border-mamdani-steel bg-mamdani-slate/70 px-4 py-3 text-left font-terminal text-xl leading-snug text-mamdani-fog transition-colors hover:border-mamdani-cyan hover:text-white"
            >
              {opt.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`border-2 px-4 py-3 ${
              s.reaction?.type === "message"
                ? "border-mamdani-mint text-mamdani-mint"
                : s.reaction?.type === "trap"
                  ? "border-mamdani-red text-mamdani-red"
                  : "border-mamdani-gold text-mamdani-gold"
            }`}
          >
            <p className="font-pixel text-[8px] uppercase">
              {s.reaction?.type === "message"
                ? "On Message"
                : s.reaction?.type === "trap"
                  ? "Took The Bait"
                  : "Dodged"}
            </p>
            <p className="mt-1 font-terminal text-xl leading-snug">{s.reaction?.reaction}</p>
          </div>
          <button onClick={next} className={primaryBtn}>
            {s.index + 1 >= INTERVIEW_QUESTIONS.length ? "▸ Final tally" : "▸ Next question"}
          </button>
        </div>
      )}
    </Shell>
  );
}

const primaryBtn =
  "min-h-[48px] w-full rounded-sm border-2 border-black bg-mamdani-gold px-4 py-2 font-pixel text-[10px] uppercase text-mamdani-ink shadow-pixel active:translate-y-[2px] active:shadow-none";

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="panel crt mx-auto max-w-xl space-y-4 px-5 py-5">{children}</div>;
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
      <div className="mb-1 flex justify-between font-pixel text-[8px] uppercase text-mamdani-fog">
        <span>{label}</span>
        <span style={{ color: danger ? "#FF2E4D" : color }}>{value}</span>
      </div>
      <div className="h-3 w-full overflow-hidden border-2 border-mamdani-steel bg-mamdani-ink">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
