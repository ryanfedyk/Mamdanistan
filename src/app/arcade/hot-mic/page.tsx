"use client";

import Link from "next/link";
import { InterviewGame } from "@/components/arcade/InterviewGame";
import { getCabinet } from "@/data/games";

export default function HotMicPage() {
  const cab = getCabinet("hot-mic");
  return (
    <div className="space-y-6">
      <Link
        href="/arcade"
        className="inline-block font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
      >
        ‹ Back to The Arcade
      </Link>
      <header className="space-y-2">
        <h1 className="pixel-heading text-lg text-mamdani-cyan sm:text-2xl">
          {cab?.title ?? "Hot Mic"}
        </h1>
        <p className="max-w-2xl font-terminal text-xl leading-relaxed text-mamdani-fog">
          {cab?.howToPlay}
        </p>
      </header>

      <InterviewGame />
    </div>
  );
}
