/**
 * Campaign-style progress bar. Navy-outlined track on paper, sun-yellow fill
 * that animates up on mount via the `--bar-fill` custom property.
 */
export function ProgressBar({
  value,
  label,
  color = "#FFC72C",
}: {
  value: number;
  label?: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between font-display text-sm font-bold uppercase tracking-wide text-campaign-navy">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="h-5 w-full overflow-hidden rounded-full border-2 border-campaign-navy bg-campaign-cream">
        <div
          className="h-full animate-fill-up rounded-r-full"
          style={
            {
              backgroundColor: color,
              "--bar-fill": `${clamped}%`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
