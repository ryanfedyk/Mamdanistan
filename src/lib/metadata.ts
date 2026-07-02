import type { Metadata } from "next";
import { getCabinet } from "@/data/games";

/**
 * Build per-cabinet page metadata (title, description, social-preview cards)
 * from the shared arcade catalog. Used by each /arcade/<game>/layout.tsx so
 * every game route is independently shareable with a rich link preview.
 */
export function cabinetMetadata(id: string): Metadata {
  const cab = getCabinet(id);
  if (!cab) return {};

  const title = cab.title;
  const description = cab.blurb;
  const url = `/arcade/${cab.id}`;
  // Prefer the cabinet's cover art; fall back to the site postcard.
  const image = cab.hero ?? "/mamdanistan-postcard.webp";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${title} · Mamdanistan`,
      description,
      images: [{ url: image, alt: `${title} — Mamdanistan arcade` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Mamdanistan`,
      description,
      images: [image],
    },
  };
}
