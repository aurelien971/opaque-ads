// The mark: a ring with one dot on it at about 1 o'clock. Built once, sized
// by props — nav (26), footer (18), step bullets (18, with a number), and the
// 190px clock on the dark step-4 card (with the warm glow).
export default function OrbitMark({
  size = 26,
  ring = "rgba(22,21,15,0.28)",
  ringWidth = 1.5,
  dot = "#16150F",
  glow = false,
  children,
  className = "",
}: {
  size?: number;
  ring?: string;
  ringWidth?: number;
  dot?: string;
  glow?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const d = Math.max(5, Math.round(size * 0.27));
  // Dot sits on the ring at ~1 o'clock.
  const left = Math.round(size * 0.73 - d / 2);
  const top = Math.round(size * 0.115);
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden>
      <span className="absolute inset-0 rounded-full" style={{ border: `${ringWidth}px solid ${ring}` }} />
      <span
        className="absolute rounded-full"
        style={{ left, top, width: d, height: d, background: dot, boxShadow: glow ? "0 0 30px 8px rgba(255,206,138,0.5)" : undefined }}
      />
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  );
}
