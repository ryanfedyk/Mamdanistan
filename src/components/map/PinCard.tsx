import type { MapPin } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBanner } from "@/components/ui/StatusBanner";

/**
 * Localized card view pulled in when a map pin is clicked. Renders the
 * win's news clips, press, and policy metrics. Pure presentational.
 */
export function PinCard({ pin, onClose }: { pin: MapPin; onClose?: () => void }) {
  const color = CATEGORY_COLORS[pin.category];

  return (
    <article className="panel crt overflow-hidden">
      <div
        className="flex items-start justify-between gap-3 border-b-2 border-mamdani-steel px-4 py-3"
        style={{ background: `linear-gradient(90deg, ${color}22, transparent)` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {CATEGORY_GLYPHS[pin.category]}
            </span>
            <h3 className="pixel-heading text-[11px]" style={{ color }}>
              {pin.title}
            </h3>
          </div>
          <p className="mt-1 font-pixel text-[8px] uppercase text-mamdani-fog">
            {pin.neighborhood} · {pin.borough}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close card"
            className="font-pixel text-xs text-mamdani-fog hover:text-mamdani-red"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4 px-4 py-4">
        <StatusBanner text={pin.statusBanner} tone="victory" />

        <p className="font-body text-xl leading-snug text-white">{pin.tagline}</p>
        <p className="font-body text-lg leading-relaxed text-mamdani-fog">
          {pin.description}
        </p>

        <ProgressBar value={pin.progress} label="Win progress" color={color} />

        <div>
          <h4 className="mb-2 font-pixel text-[9px] uppercase text-mamdani-gold">
            The Receipts
          </h4>
          <ul className="space-y-2">
            {pin.references.map((ref, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-sm border border-mamdani-steel bg-mamdani-ink/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 font-body text-lg text-mamdani-fog">
                  <RefBadge kind={ref.kind} />
                  {ref.href ? (
                    <a
                      href={ref.href}
                      className="underline decoration-dotted hover:text-mamdani-cyan"
                    >
                      {ref.label}
                    </a>
                  ) : (
                    ref.label
                  )}
                </span>
                {ref.value && (
                  <span
                    className="font-pixel text-[10px]"
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
    article: { label: "NEWS", cls: "text-mamdani-cyan border-mamdani-cyan" },
    press: { label: "PRESS", cls: "text-mamdani-gold border-mamdani-gold" },
    metric: { label: "STAT", cls: "text-mamdani-mint border-mamdani-mint" },
  } as const;
  const b = map[kind];
  return (
    <span
      className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-pixel text-[7px] uppercase ${b.cls}`}
    >
      {b.label}
    </span>
  );
}
