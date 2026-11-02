import { shareLinks } from "@/lib/format";
import { CopyButton } from "@/components/ui/CopyButton";
import { FacebookIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

type Props = {
  /** Site path to share, e.g. "/updates/training-day-3f2a1c". */
  path: string;
  /** Message placed before the link in WhatsApp. */
  text: string;
  tone?: "light" | "dark";
};

/** WhatsApp, Facebook and copy-link buttons for one page. */
export function ShareButtons({ path, text, tone = "light" }: Props) {
  const share = shareLinks(path, text);
  const styles =
    tone === "dark"
      ? "border-white/25 text-white hover:bg-white/10"
      : "border-line text-forest hover:bg-club-tint";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className={tone === "dark" ? "text-white/75" : "text-ink-soft"}>Share:</span>
      <a
        href={share.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold ${styles}`}
      >
        <WhatsAppIcon className="size-4" /> WhatsApp
      </a>
      <a
        href={share.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold ${styles}`}
      >
        <FacebookIcon className="size-4" /> Facebook
      </a>
      <CopyButton value={share.url} label="page link" tone={tone} />
    </div>
  );
}
