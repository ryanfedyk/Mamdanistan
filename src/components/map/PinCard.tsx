import type { MapPin } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBanner } from "@/components/ui/StatusBanner";

/**
 * Localized card view pulled in when a map pin is clicked. Renders the
 * win's news clips, press, and policy metrics. Campaign-poster styling.
 */
export function PinCard({ pin, onClose }: { pin: MapPin; onClose?: () => void }) {
  const color = CATEGORY_COLORS[pin.category];

  return (
    <article className="card-poster overflow-hidden">
      <div
        className="flex items-start justify-between gap-3 border-b-2 border-campaign-navy px-5 py-4"
        style={{ backgroundColor: color }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {CATEGORY_GLYPHS[pin.category]}
            </span>
            <h3 className="font-display text-xl font-black text-campaign-cream drop-shadow-[1px_1px_0_rgba(14,33,80,0.6)]">
              {pin.title}
            </h3>
          </div>
          <p className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-campaign-cream/90">
            {pin.neighborhood} · {pin.borough}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close card"
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-campaign-navy bg-campaign-cream font-display font-bold text-campaign-navy"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4 px-5 py-5">
        <StatusBanner text={pin.statusBanner} tone="victory" />

        <p className="font-display text-2xl font-bold leading-tight text-campaign-navy">
          {pin.tagline}
        </p>
        <p className="font-sans text-lg leading-relaxed text-campaign-ink/80">
          {pin.description}
        </p>

        <ProgressBar value={pin.progress} label="Win progress" color={color} />

        <div>
          <h4 className="mb-2 font-display text-base font-black uppercase tracking-wide text-campaign-navy">
            The Receipts
          </h4>
          <ul className="space-y-2">
            {pin.references.map((ref, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border-2 border-campaign-navy/30 bg-campaign-cream px-3 py-2"
              >
                <span className="flex items-center gap-2 font-sans text-base text-campaign-ink">
                  <RefBadge kind={ref.kind} />
                  {ref.href ? (
                    <a
                      href={ref.href}
                      className="underline decoration-dotted hover:text-campaign-blue"
                    >
                      {ref.label}
                    </a>
                  ) : (
                    ref.label
                  )}
                </span>
                {ref.value && (
                  <span
                    className="shrink-0 font-display text-base font-black"
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

function RefBadge({ kind }: { kind: MapPin["references"][number]["kind"] }) {
  const map = {
    article: { label: "NEWS", cls: "bg-campaign-sky text-campaign-cream" },
    press: { label: "PRESS", cls: "bg-campaign-gold text-campaign-navy" },
    metric: { label: "STAT", cls: "bg-campaign-blue text-campaign-cream" },
  } as const;
  const b = map[kind];
  return (
    <span
      className={`shrink-0 rounded-full border-2 border-campaign-navy px-2 py-0.5 font-display text-[10px] font-bold uppercase ${b.cls}`}
    >
      {b.label}
    </span>
  );
}
