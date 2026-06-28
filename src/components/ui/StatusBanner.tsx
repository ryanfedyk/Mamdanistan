/**
 * Campaign-style status chip, e.g. "BUREAUCRACY LEVEL: DEFEATED".
 * Pill on the cream/blue palette with a waving flag.
 */
export function StatusBanner({
  text,
  tone = "victory",
}: {
  text: string;
  tone?: "victory" | "alert" | "neutral";
}) {
  const tones = {
    victory: "bg-campaign-sun text-campaign-navy border-campaign-navy",
    alert: "bg-campaign-brick text-campaign-cream border-campaign-navy",
    neutral: "bg-campaign-cream text-campaign-navy border-campaign-navy",
  } as const;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border-2 ${tones[tone]} px-3 py-1.5 shadow-poster-sm`}
    >
      <span className="animate-flag-wave" aria-hidden>
        🚩
      </span>
      <span className="font-display text-xs font-bold uppercase tracking-wide">
        {text}
      </span>
    </div>
  );
}
