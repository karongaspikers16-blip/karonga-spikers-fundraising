import { ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site";
import { shareLinks } from "@/lib/format";
import { postPath } from "@/lib/updates";
import { CopyButton } from "@/components/ui/CopyButton";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";

/** Shown once a post is published: its link, ready to send to the club's WhatsApp groups. */
export function SharePanel({ slug, title }: { slug: string; title: string }) {
  const share = shareLinks(postPath(slug), `${title}: news from ${siteConfig.club.shortName}.`);

  return (
    <section aria-labelledby="share-title" className="rounded-2xl bg-forest p-5 text-white sm:p-6">
      <h2 id="share-title" className="font-display text-2xl font-bold">
        Share this post
      </h2>
      <p className="mt-1 break-all text-sm text-white/75">{share.url}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={share.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 font-bold text-forest hover:bg-white"
        >
          <WhatsAppIcon className="size-5" /> Share on WhatsApp
        </a>
        <CopyButton value={share.url} label="post link" tone="dark" />
        <a
          href={postPath(slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          <ExternalLink className="size-4" aria-hidden /> View post
        </a>
      </div>
      <p className="mt-3 text-xs text-white/60">The public page can take up to a minute to show changes.</p>
    </section>
  );
}
