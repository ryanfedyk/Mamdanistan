import Link from "next/link";

type Variant = "sun" | "blue" | "brick" | "outline";

const VARIANTS: Record<Variant, string> = {
  sun: "bg-campaign-sun text-campaign-navy border-campaign-navy shadow-poster-sm",
  blue: "bg-campaign-blue text-campaign-cream border-campaign-navy shadow-poster-sm",
  brick:
    "bg-campaign-brick text-campaign-cream border-campaign-navy shadow-poster-sm",
  outline:
    "bg-campaign-cream text-campaign-navy border-campaign-navy shadow-poster-sm",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 px-5 py-3 font-display text-base font-bold uppercase tracking-wide transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:-translate-y-0.5 min-h-[48px]";

/**
 * Campaign-poster action button. Big tap target (48px min) for mobile.
 * Renders as a Link when `href` is provided.
 */
export function Button({
  children,
  href,
  onClick,
  variant = "blue",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
}) {
  const cls = `${base} ${VARIANTS[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
