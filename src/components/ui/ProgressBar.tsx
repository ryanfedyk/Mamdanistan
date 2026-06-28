/**
 * Cheeky pixel progress bar. Animates its fill on mount via the
 * `--bar-fill` custom property wired to the `fill-up` keyframes.
 */
export function ProgressBar({
  value,
  label,
  color = "#3DDC97",
}: {
  value: number;
  label?: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between font-pixel text-[9px] uppercase text-mamdani-fog">
          <span>{label}</span>
          <span style={{ color }}>{clamped}%</span>
        </div>
      )}
      <div className="h-4 w-full overflow-hidden rounded-sm border-2 border-mamdani-steel bg-mamdani-ink">
        <div
          className="h-full animate-fill-up"
          style={
            {
              backgroundColor: color,
              "--bar-fill": `${clamped}%`,
              boxShadow: `0 0 12px ${color}`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
