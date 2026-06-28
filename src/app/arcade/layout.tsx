/**
 * Arcade-only theme boundary. Everything under /arcade renders inside the
 * `.arcade-theme` scope, flipping the 16-bit dark-cabinet skin back on while
 * the rest of the site stays in the 1970s campaign aesthetic.
 */
export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="arcade-theme crt relative -mx-4 -my-8 min-h-[80vh] overflow-hidden rounded-none border-y-4 border-mamdani-steel px-4 py-8 sm:-my-10 sm:rounded-2xl sm:border-4 sm:py-10">
      {children}
    </div>
  );
}
