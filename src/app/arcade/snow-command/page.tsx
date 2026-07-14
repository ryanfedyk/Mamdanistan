"use client";

import Link from "next/link";
import { SnowCommandArcade } from "@/components/arcade/SnowCommandArcade";

export default function SnowCommandPage() {
  return (
    <div className="space-y-3">
      {/* On mobile the game is a fixed full-window layer with its own nav. */}
      <Link
        href="/arcade"
        className="hidden font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan lg:inline-block"
      >
        ‹ Back to The Arcade
      </Link>
      <SnowCommandArcade />
    </div>
  );
}
