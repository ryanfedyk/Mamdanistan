"use client";

import Link from "next/link";
import { HotTakeArcade } from "@/components/arcade/HotTakeArcade";

export default function HotMicPage() {
  return (
    <div className="space-y-3">
      {/* On mobile the game is a fixed full-window layer with its own Exit. */}
      <Link
        href="/arcade"
        className="hidden font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan lg:inline-block"
      >
        ‹ Back to The Arcade
      </Link>
      <HotTakeArcade />
    </div>
  );
}
