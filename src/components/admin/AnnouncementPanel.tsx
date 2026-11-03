"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";

/** The ready-made announcement with copy and WhatsApp buttons, for the secretary's daily post. */
export function AnnouncementPanel({ text }: { text: string }) {
  const [copied, setCopied] = useState<boolean | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section aria-labelledby="announcement-title" className="rounded-2xl bg-forest p-5 text-white sm:p-6">
      <h2 id="announcement-title" className="font-display text-2xl font-bold">
        Announcement
      </h2>
      <p className="mt-1 text-sm text-white/75">
        Copy it into the WhatsApp groups and Facebook. Words between *stars* show in bold on WhatsApp.
      </p>
      <textarea
        readOnly
        value={text}
        rows={Math.min(24, text.split("\n").length + 2)}
        aria-label="Announcement text"
        onFocus={(e) => e.currentTarget.select()}
        className="mt-4 block w-full rounded-lg bg-white p-3.5 font-sans text-[15px] leading-relaxed text-ink"
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3.5 font-bold text-forest hover:bg-white"
        >
          {copied ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />}
          <span aria-live="polite">{copied ? "Copied" : "Copy message"}</span>
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-4 py-3.5 font-bold text-white hover:bg-white/10"
        >
          <WhatsAppIcon className="size-5" /> Share on WhatsApp
        </a>
      </div>
      {copied === false && (
        <p role="alert" className="mt-2 text-sm text-gold">
          Could not copy automatically. Tap the text, select all, then copy.
        </p>
      )}
    </section>
  );
}
