/**
 * Hero chip: a descending bar chart with a declining red trend line and the
 * word "Bureaucracy" — the deadpan replacement for the old
 * "BUREAUCRACY LEVEL: DEFEATED" banner. The trend line draws itself in on load.
 */
export function BureaucracyMeter() {
  return (
    <div className="inline-flex items-center gap-2 border-4 border-outline bg-white px-3 py-1.5 brutal-shadow">
      <svg
        width="30"
        height="20"
        viewBox="0 0 30 20"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        {/* Descending bars — bureaucracy trending down. */}
        <rect x="0.5" y="3" width="5" height="16" fill="#241AC9" />
        <rect x="8" y="7" width="5" height="12" fill="#241AC9" />
        <rect x="15.5" y="11" width="5" height="8" fill="#241AC9" />
        <rect x="23" y="14.5" width="5" height="4.5" fill="#241AC9" />
        {/* Declining trend line, drawn in on load. */}
        <path
          d="M3 2.5 L27 15.5"
          stroke="#FF0000"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="30"
          className="animate-trend-draw"
        />
        {/* Arrowhead at the low end, pointing down-right. */}
        <path
          d="M27 15.5 l-5.5 0.6 M27 15.5 l0.6 -5.5"
          stroke="#FF0000"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-xs font-black uppercase tracking-wide text-black">
        Bureaucracy
      </span>
    </div>
  );
}
