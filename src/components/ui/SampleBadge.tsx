type Props = {
  show: boolean;
  label?: string;
  tone?: "light" | "dark";
};

/** Flags mock data on the page. Disappears when the matching `isSample` flag in site config is false. */
export function SampleBadge({ show, label = "Sample details", tone = "light" }: Props) {
  if (!show) return null;
  const styles =
    tone === "dark"
      ? "border-gold/70 text-gold"
      : "border-[#c9a800] bg-gold-tint text-ink";
  return (
    <span
      title="Mock data for the design. Replace in src/config/site.ts before launch."
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold ${styles}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
