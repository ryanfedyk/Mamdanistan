import type { Metadata } from "next";
import { cabinetMetadata } from "@/lib/metadata";

// Server-side metadata for a client-rendered game page, so this route is
// independently shareable with its own title + preview card.
export const metadata: Metadata = cabinetMetadata("landlord-invaders");

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
