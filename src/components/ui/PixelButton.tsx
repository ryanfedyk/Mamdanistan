import Link from "next/link";

type Variant = "cyan" | "mint" | "red" | "gold";

const VARIANTS: Record<Variant, string> = {
  cyan: "bg-mamdani-cyan text-mamdani-ink hover:shadow-glow",
  mint: "bg-mamdani-mint text-mamdani-ink hover:shadow-glow",
  red: "bg-mamdani-red text-white hover:shadow-glow-red",
  gold: "bg-mamdani-gold text-mamdani-ink hover:shadow-glow",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-sm border-2 border-black px-4 py-2 font-pixel text-[10px] uppercase tracking-wider shadow-pixel transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

/** Arcade-style action button. Renders as a Link when `href` is given. */
export function PixelButton({
  children,
  href,
  onClick,
  variant = "cyan",
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  type?: "button" | "submit";
  className?: string;
}) {
  const cls = `${baseClass} ${VARIANTS[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
