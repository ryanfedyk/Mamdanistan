/**
 * Brutalist progress bar: hard black-bordered track, solid color fill that
 * animates up on mount via the `--bar-fill` custom property.
 */
export function ProgressBar({
  value,
  label,
  color = "#0000FF",
}: {
  value: number;
  label?: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between font-display text-xs font-black uppercase tracking-wide text-on-surface">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="h-5 w-full overflow-hidden border-4 border-outline bg-white">
        <div
          className="h-full animate-fill-up"
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
