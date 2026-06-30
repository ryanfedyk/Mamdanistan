import Link from "next/link";
import type { MapPin } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { getCabinet } from "@/data/games";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBanner } from "@/components/ui/StatusBanner";

/**
 * Localized card view pulled in when a map pin is clicked. Renders the
 * win's news clips, press, and policy metrics. Brutalist styling.
 */
export function PinCard({ pin, onClose }: { pin: MapPin; onClose?: () => void }) {
  const color = CATEGORY_COLORS[pin.category];

  return (
    <article className="brutal-card overflow-hidden">
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
