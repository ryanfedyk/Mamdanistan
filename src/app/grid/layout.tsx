import type { Metadata } from "next";

// Server-side metadata for the client-rendered Grid page, so /grid is
// independently shareable with its own title + preview card.
export const metadata: Metadata = {
  title: "The Grid",
  description:
    "Tactical map of the five boroughs — every pool reopened, pothole patched, and bus lane freed, pinned across New York City.",
  alternates: { canonical: "/grid" },
  openGraph: {
    type: "website",
    url: "/grid",
    title: "The Grid · Mamdanistan",
    description:
      "Tactical map of the five boroughs — track New York's material wins pin by pin.",
    images: [{ url: "/mamdanistan-postcard.webp", width: 1000, height: 652, alt: "Mamdanistan" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Grid · Mamdanistan",
    description:
      "Tactical map of the five boroughs — track New York's material wins pin by pin.",
    images: ["/mamdanistan-postcard.webp"],
  },
};

export default function GridLayout({ children }: { children: React.ReactNode }) {
  return children;
}
