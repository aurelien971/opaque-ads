// The mark: a ring on an orbit with a satellite — content moving on schedule.
export default function Logo({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="15" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="1.5" strokeDasharray="3 5" />
      <circle cx="49.7" cy="14.3" r="5" fill="#547dcc" />
    </svg>
  );
}
