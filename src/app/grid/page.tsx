"use client";

import { MobileMap } from "@/components/map/MobileMap";

export default function GridPage() {
  // One full-window tactical map for every screen size: drag to pan, wheel /
  // pinch / +- to zoom, and click a pin for its briefing in a bottom sheet.
  return <MobileMap />;
}
