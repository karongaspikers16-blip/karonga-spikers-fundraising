import { Check, Medal } from "lucide-react";
import { siteConfig, type TierId } from "@/config/site";
import { formatMoney, whatsappLink } from "@/lib/format";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Campaign } from "@/lib/campaign";

const tierStyle: Record<TierId, { card: string; medal: string; text: string; sub: string; button: string; check: string }> = {
  gold: {
    card: "bg-forest text-white ring-2 ring-gold lg:-my-4 lg:py-11",
    medal: "bg-gold text-forest",
    text: "text-white",
    sub: "text-white/75",
    button: "bg-gold text-forest hover:bg-white",
    check: "text-gold",
  },
  silver: {
    card: "bg-white ring-1 ring-line",
    medal: "bg-[#D9DEE1] text-[#4B5560]",
    text: "text-forest",
    sub: "text-ink-soft",
    button: "bg-club text-white hover:bg-forest",
    check: "text-club",
  },
  bronze: {
    card: "bg-white ring-1 ring-line",
    medal: "bg-[#F1DCC6] text-[#8A4E1C]",
    text: "text-forest",
    sub: "text-ink-soft",
    button: "bg-club text-white hover:bg-forest",
    check: "text-club",
  },
};

type Props = { sponsors: Campaign["sponsors"]; whatsappNumber: string };

export function SponsorshipPackages({ sponsors, whatsappNumber }: Props) {
  const { sponsorship, club } = siteConfig;

  return (
    <section id="sponsors" aria-labelledby="sponsors-title" className="px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="sponsors-title"
          title="Sponsorship packages"
          intro="Back the team as a business, organisation or group of friends. We will agree the details with you directly."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:items-center">
          {sponsorship.tiers.map((tier) => {
            const s = tierStyle[tier.id];
            return (
              <article key={tier.id} className={`flex h-full flex-col rounded-2xl p-7 sm:p-8 ${s.card}`}>
                <div className="flex items-center gap-3">
                  <span className={`grid size-12 place-items-center rounded-full ${s.medal}`}>
                    <Medal className="size-6" aria-hidden />
                  </span>
                  <h3 className={`font-display text-3xl font-extrabold uppercase ${s.text}`}>{tier.name}</h3>
                </div>

                <p className={`mt-5 font-display text-xl font-semibold ${s.sub}`}>
                  {tier.amount !== null ? `From ${formatMoney(tier.amount)}` : "Amount by arrangement"}
                </p>

                <ul className="mt-6 mb-8 space-y-3">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className={`flex gap-3 ${s.text}`}>
                      <Check className={`mt-0.5 size-5 shrink-0 ${s.check}`} aria-hidden />
                      <span className="leading-snug">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappLink(
                    `Hello ${club.shortName}, I would like to talk about becoming a ${tier.name} for the national tournament.`,
                    whatsappNumber,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto inline-flex items-center justify-center rounded-lg px-5 py-3.5 font-bold transition-colors ${s.button}`}
                >
                  Become a {tier.name}
                </a>
              </article>
            );
          })}
        </div>

        {sponsors.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-2xl font-bold text-forest">Thank you to our sponsors</h3>
            <ul className="mt-5 flex flex-wrap gap-3">
              {sponsors.map((sponsor) => (
                <li
                  key={sponsor.name}
                  className={`rounded-xl px-5 py-3 font-semibold ${
                    sponsor.tier === "gold"
                      ? "bg-forest text-lg text-gold"
                      : "bg-white text-forest ring-1 ring-line"
                  }`}
                >
                  {sponsor.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
