import Link from "next/link";

type Variant = "blue" | "orange" | "red" | "white";

const VARIANTS: Record<Variant, string> = {
  blue: "bg-primary text-white brutal-shadow",
  orange: "bg-secondary text-on-secondary brutal-shadow",
  red: "bg-tertiary text-white brutal-shadow",
  white: "bg-white text-black brutal-shadow",
};

/**
 * Neo-brutalist action button. Big tap target (48px min); presses into its
 * shadow on hover/active. Renders as a Link when `href` is provided.
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
  const cls = `btn-brutal ${VARIANTS[variant]} ${className}`;
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
