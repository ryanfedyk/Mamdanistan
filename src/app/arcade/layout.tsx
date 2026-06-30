/**
 * Arcade-only theme boundary. Everything under /arcade renders inside the
 * `.arcade-theme` scope — the 16-bit dark-cabinet skin — while the rest of
 * the site stays neo-brutalist. Full-bleed dark band with padded content.
 */
export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="arcade-theme crt relative min-h-[80vh] overflow-hidden border-y-4 border-outline">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-12">{children}</div>
    </div>
  );
}
