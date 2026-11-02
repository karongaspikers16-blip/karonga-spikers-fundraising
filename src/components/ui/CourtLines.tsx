/**
 * Top-down volleyball court drawn in thin lines: the hero's background texture
 * until a real team photo is set in site config.
 */
export function CourtLines({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 560" fill="none" aria-hidden className={className} preserveAspectRatio="xMidYMid slice">
      <g stroke="white" strokeOpacity="0.13" strokeWidth="3">
        {/* Court boundary: 18 m x 9 m */}
        <rect x="140" y="100" width="720" height="360" />
        {/* Attack lines, 3 m either side of the net */}
        <line x1="380" y1="100" x2="380" y2="460" />
        <line x1="620" y1="100" x2="620" y2="460" />
        {/* Free zone dashes */}
        <rect x="60" y="40" width="880" height="480" strokeDasharray="10 14" strokeOpacity="0.07" />
      </g>
      {/* The net */}
      <line x1="500" y1="70" x2="500" y2="490" stroke="#FFD700" strokeOpacity="0.4" strokeWidth="5" />
      <circle cx="500" cy="70" r="7" fill="#FFD700" fillOpacity="0.4" />
      <circle cx="500" cy="490" r="7" fill="#FFD700" fillOpacity="0.4" />
    </svg>
  );
}
