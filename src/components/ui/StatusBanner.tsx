/**
 * Brutalist status chip, e.g. "BUREAUCRACY LEVEL: DEFEATED".
 * Hard-bordered block with a blinking live dot.
 */
export function StatusBanner({
  text,
  tone = "victory",
}: {
  text: string;
  tone?: "victory" | "alert" | "neutral";
}) {
  const tones = {
    victory: "bg-secondary text-on-secondary",
    alert: "bg-tertiary text-white",
    neutral: "bg-white text-black",
  } as const;

  return (
    <div
      className={`inline-flex items-center gap-2 border-4 border-outline ${tones[tone]} px-3 py-1.5 brutal-shadow`}
    >
      <span className="h-3 w-3 animate-blink rounded-full bg-tertiary shadow-[2px_2px_0_0_#000]" />
      <span className="font-display text-xs font-black uppercase tracking-wide">
        {text}
      </span>
    </div>
  );
}
