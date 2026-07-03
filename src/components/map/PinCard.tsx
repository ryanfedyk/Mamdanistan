"use client";

import { useState } from "react";
import Link from "next/link";
import type { MapPin } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { getCabinet } from "@/data/games";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBanner } from "@/components/ui/StatusBanner";

/** Pull an 11-char YouTube id out of a watch / embed / youtu.be / thumbnail URL. */
function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/|img\.youtube\.com\/vi\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/**
 * Localized card view pulled in when a map pin is clicked. Renders the
 * win's news clips, press, and policy metrics. Brutalist styling.
 */
export function PinCard({
  pin,
  onClose,
  bare = false,
}: {
  pin: MapPin;
  onClose?: () => void;
  /** Drop the card border/shadow — for embedding inside a bottom sheet. */
  bare?: boolean;
}) {
  const color = CATEGORY_COLORS[pin.category];
  const videoId = youtubeId(pin.image);

  return (
    <article className={bare ? "overflow-hidden" : "brutal-card overflow-hidden"}>
      <div
        className="flex items-start justify-between gap-3 border-b-4 border-outline px-5 py-4"
        style={{ backgroundColor: color }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {CATEGORY_GLYPHS[pin.category]}
            </span>
            <h3 className="brutal-heading text-xl text-white drop-shadow-[2px_2px_0_#000]">
              {pin.title}
            </h3>
          </div>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-white">
            {pin.neighborhood} · {pin.borough}
          </p>
          {pin.kind && (
            <span className="mt-2 inline-block border-2 border-outline bg-white px-1.5 py-0.5 text-[10px] font-black uppercase text-black">
              {pin.kind === "moment" ? "★ Moment" : "◆ Policy Win"}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close card"
            className="grid h-9 w-9 place-items-center border-2 border-outline bg-white font-black text-black"
          >
            ✕
          </button>
        )}
      </div>

      {/* Media (hot-linked). YouTube-backed pins get a click-to-play embed;
          everything else is a still. A broken/blocked URL degrades cleanly. */}
      {videoId ? (
        <LiteYouTube
          id={videoId}
          poster={pin.image!}
          title={pin.imageAlt ?? pin.title}
          credit={pin.imageCredit}
        />
      ) : (
        pin.image && (
          <figure className="relative border-b-4 border-outline bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pin.image}
              alt={pin.imageAlt ?? pin.title}
              loading="lazy"
              onError={(e) => {
                const fig = e.currentTarget.closest("figure");
                if (fig) (fig as HTMLElement).style.display = "none";
              }}
              className="h-44 w-full object-cover"
            />
            {pin.imageCredit && (
              <figcaption className="absolute bottom-0 right-0 bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                {pin.imageCredit}
              </figcaption>
            )}
          </figure>
        )
      )}

      <div className="space-y-4 px-5 py-5">
        <StatusBanner text={pin.statusBanner} tone="victory" />

        <p className="text-2xl font-black uppercase leading-tight text-black">
          {pin.tagline}
        </p>
        <p className="text-base font-bold leading-relaxed text-black/80">
          {pin.description}
        </p>

        <ProgressBar value={pin.progress} label="Win progress" color={color} />

        {pin.gameSlug && <MissionLink slug={pin.gameSlug} />}

        <div>
          <h4 className="mb-2 brutal-heading text-base text-black">
            The Receipts
          </h4>
          <ul className="space-y-2">
            {pin.references.map((ref, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 border-2 border-outline bg-background px-3 py-2"
              >
                <span className="flex items-center gap-2 text-base font-bold text-black">
                  <RefBadge kind={ref.kind} />
                  {ref.href ? (
                    <a
                      href={ref.href}
                      className="underline decoration-2 hover:text-primary"
                    >
                      {ref.label}
                    </a>
                  ) : (
                    ref.label
                  )}
                </span>
                {ref.value && (
                  <span
                    className="shrink-0 text-base font-black"
                    style={{ color }}
                  >
                    {ref.value}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

/** Lazy YouTube embed: shows the thumbnail + play button, and only mounts the
 *  iframe on click — cheap on low-end phones, and a clean fallback if the embed
 *  host is blocked (the poster + play affordance still render). */
function LiteYouTube({
  id,
  poster,
  title,
  credit,
}: {
  id: string;
  poster: string;
  title: string;
  credit?: string;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      className="relative border-b-4 border-outline bg-black"
      style={{ aspectRatio: "16 / 9" }}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt={title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
            className="h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-white bg-[#FF0000] text-xl text-white shadow-brutal transition-transform group-hover:scale-110 group-active:scale-95">
              ▶
            </span>
          </span>
          {credit && (
            <span className="absolute bottom-0 right-0 bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              {credit}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

/** CTA linking a win to its arcade mission. Falls back to the hub for
 *  games that aren't built yet (shown as "coming soon"). */
function MissionLink({ slug }: { slug: string }) {
  const cabinet = getCabinet(slug);
  const href = cabinet ? `/arcade/${slug}` : "/arcade";
  return (
    <Link
      href={href}
      className="btn-brutal w-full bg-primary text-white brutal-shadow"
    >
      {cabinet ? "▶ Play the Mission" : "▶ Mission Incoming (Soon)"}
    </Link>
  );
}

function RefBadge({ kind }: { kind: MapPin["references"][number]["kind"] }) {
  const map = {
    article: { label: "NEWS", cls: "bg-primary text-white" },
    press: { label: "PRESS", cls: "bg-secondary text-black" },
    metric: { label: "STAT", cls: "bg-tertiary text-white" },
  } as const;
  const b = map[kind];
  return (
    <span
      className={`shrink-0 border-2 border-outline px-1.5 py-0.5 text-[10px] font-black uppercase ${b.cls}`}
    >
      {b.label}
    </span>
  );
}
