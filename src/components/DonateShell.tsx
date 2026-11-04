import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/ui/Logo";

/** Page frame for /donate, /donate/thank-you and /donate/cancelled: club badge, a title and a white card. */
export function DonateShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-mist">
      <header className="bg-forest text-white">
        <div className="mx-auto max-w-2xl px-5 pt-6 pb-24">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" aria-label={`${siteConfig.club.name}: home`}>
              <Logo tone="dark" size={44} />
            </Link>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white">
              <ArrowLeft className="size-4" aria-hidden /> Home
            </Link>
          </div>
          <h1 className="mt-10 font-display text-[clamp(2.5rem,9vw,4rem)] font-extrabold uppercase leading-[0.9]">{title}</h1>
          {intro && <p className="mt-3 text-lg text-white/85">{intro}</p>}
        </div>
      </header>
      <main className="mx-auto -mt-16 max-w-2xl px-5 pb-16">
        <div className="rounded-2xl bg-white p-5 shadow-[0_24px_60px_-20px_rgba(14,38,61,0.35)] ring-1 ring-forest/5 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
