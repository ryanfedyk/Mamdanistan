"use client";

import { useState } from "react";
import Link from "next/link";
import { ARCADE_CABINETS } from "@/data/games";

/**
 * The cabinet grid for the arcade hub. Finished games always show; the
 * unfinished prototypes hide behind a "show unreleased betas" toggle so the
 * floor stays clean but the curious can still poke at works-in-progress.
 */
export function ArcadeGrid() {
  const [showBeta, setShowBeta] = useState(false);
  const released = ARCADE_CABINETS.filter((c) => c.status === "playable");
  const betas = ARCADE_CABINETS.filter((c) => c.status !== "playable");

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {released.map((cab) => (
          <Cabinet key={cab.id} cab={cab} />
        ))}
      </div>

      {betas.length > 0 && (
        <div className="space-y-5">
          <button
            onClick={() => setShowBeta((v) => !v)}
            className="mx-auto block rounded-sm border-2 border-mamdani-steel bg-mamdani-ink/70 px-4 py-2 font-pixel text-[9px] uppercase tracking-wider text-mamdani-gold transition-colors hover:border-mamdani-gold hover:text-white"
          >
            {showBeta
              ? "▴ Hide unreleased betas"
              : `▾ Show unreleased betas (${betas.length})`}
          </button>

          {showBeta && (
            <>
              <p className="text-center font-pixel text-[8px] uppercase text-mamdani-fog/70">
                ⚠ Prototypes — unfinished, unbalanced, unhinged
              </p>
              <div className="grid gap-5 opacity-80 sm:grid-cols-2">
                {betas.map((cab) => (
                  <Cabinet key={cab.id} cab={cab} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Cabinet({ cab }: { cab: (typeof ARCADE_CABINETS)[number] }) {
  return (
    <Link
      href={`/arcade/${cab.id}`}
      className="panel crt group block overflow-hidden transition-transform hover:-translate-y-1"
    >
      {cab.hero ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-mamdani-ink/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cab.hero}
            alt={`${cab.title} — title art`}
            className="h-full w-full object-cover transition-transform duration-200 [image-rendering:pixelated] group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center bg-mamdani-ink/60 py-8 text-6xl">
          <span className="group-hover:animate-press-start" aria-hidden>
            {cab.glyph}
          </span>
        </div>
      )}
      <div className="space-y-2 border-t-2 border-mamdani-steel px-5 py-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-pixel text-xs uppercase text-mamdani-mint">{cab.title}</h2>
          <span
            className={`rounded-sm border px-1.5 py-0.5 font-pixel text-[7px] uppercase ${
              cab.status === "playable"
                ? "border-mamdani-mint text-mamdani-mint"
                : "border-mamdani-gold text-mamdani-gold"
            }`}
          >
            {cab.status === "playable" ? "Playable" : "Beta"}
          </span>
        </div>
        <p className="font-terminal text-xl text-white">{cab.blurb}</p>
        <p className="font-terminal text-lg leading-relaxed text-mamdani-fog">
          {cab.howToPlay}
        </p>
        <span className="inline-block pt-1 font-pixel text-[9px] uppercase text-mamdani-cyan group-hover:text-white">
          ▸ Play now
        </span>
      </div>
    </Link>
  );
}
