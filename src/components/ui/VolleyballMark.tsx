/** A small volleyball, used as the marker that rides the fundraising progress bar. */
export function VolleyballMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <circle cx="16" cy="16" r="14.5" fill="#FFFFFF" stroke="var(--color-forest)" strokeWidth="2" />
      <path d="M16 1.5c-2 5-1.5 10 0 14.5" fill="none" stroke="var(--color-forest)" strokeWidth="1.8" />
      <path d="M16 16c4.5-1 9.5-.2 13.6 3.3" fill="none" stroke="var(--color-forest)" strokeWidth="1.8" />
      <path d="M16 16c-2.9 3.5-7.3 6.8-12.5 6.8" fill="none" stroke="var(--color-forest)" strokeWidth="1.8" />
      <path d="M4.2 8.4C9 8.6 13.4 11.5 16 16" fill="none" stroke="#FFD700" strokeWidth="2.4" />
      <path d="M27.5 7.6c-1.8 4.6-6.4 7.8-11.5 8.4" fill="none" stroke="#FFD700" strokeWidth="2.4" />
    </svg>
  );
}
