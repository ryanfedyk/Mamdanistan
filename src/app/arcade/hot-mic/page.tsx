"use client";

import Link from "next/link";
import { HotTakeArcade } from "@/components/arcade/HotTakeArcade";

export default function HotMicPage() {
  return (
    <div className="space-y-3">
      <Link
        href="/arcade"
        className="inline-block font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
      >
        ‹ Back to The Arcade
      </Link>
      <HotTakeArcade />
    </div>
  );
}
