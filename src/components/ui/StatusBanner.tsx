/**
 * Pixel-flag status banner, e.g. "BUREAUCRACY LEVEL: DEFEATED".
 * The signature bit of arcade flavor — drop it anywhere a win is declared.
 */
export function StatusBanner({
  text,
  tone = "victory",
}: {
  text: string;
  tone?: "victory" | "alert" | "neutral";
}) {
  const tones = {
    victory: "border-mamdani-mint text-mamdani-mint",
    alert: "border-mamdani-red text-mamdani-red",
    neutral: "border-mamdani-cyan text-mamdani-cyan",
  } as const;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-sm border-2 ${tones[tone]} bg-mamdani-ink/70 px-3 py-1.5`}
    >
      <span className="animate-flag-wave" aria-hidden>
        🚩
      </span>
      <span className="font-pixel text-[9px] uppercase tracking-wider">
        {text}
      </span>
    </div>
  );
}
