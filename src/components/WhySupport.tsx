import { Backpack, Bed, BusFront, FileDown, Trophy, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { siteConfig, type NeedIcon } from "@/config/site";
import { formatMoney } from "@/lib/format";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SampleBadge } from "@/components/ui/SampleBadge";

const icons: Record<NeedIcon, LucideIcon> = {
  transport: BusFront,
  accommodation: Bed,
  meals: UtensilsCrossed,
  tournament: Trophy,
  logistics: Backpack,
};

export function WhySupport() {
  const { needs, club, tournament } = siteConfig;
  const estimates = needs.items.map((i) => i.estimate).filter((n): n is number => n !== null);
  const total = estimates.reduce((sum, n) => sum + n, 0);

  return (
    <section id="campaign" aria-labelledby="campaign-title" className="px-5 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading id="campaign-title" title="Help us make Karonga proud" />
          <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-ink-soft">
            <p>
              {club.name} has successfully qualified for the {tournament.name}. This achievement represents the
              dedication, hard work, and passion of our players.
            </p>
            <p>
              We are now preparing to represent {club.town} at the national level. However, participation requires
              financial support to cover transport, accommodation, meals, tournament expenses, and other essential
              logistics.
            </p>
            <p>We invite individuals, businesses, organisations, and well-wishers to support our journey.</p>
          </div>
          <p className="mt-8 max-w-xl border-l-4 border-gold pl-5 font-display text-3xl font-bold leading-tight text-forest">
            Every contribution, no matter how small, will make a difference.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl font-bold text-forest">Where your money goes</h3>
            {estimates.length > 0 && <SampleBadge show={needs.isSample} label="Sample budget" />}
          </div>

          <ul className="mt-6 divide-y divide-line">
            {needs.items.map((item) => {
              const Icon = icons[item.icon];
              return (
                <li key={item.title} className="flex gap-4 py-4 first:pt-0">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-club-tint text-club">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="text-lg font-semibold text-ink">{item.title}</p>
                      {item.estimate !== null && (
                        <p className="font-display text-lg font-bold tabular-nums text-forest">
                          {formatMoney(item.estimate)}
                        </p>
                      )}
                    </div>
                    <p className="mt-0.5 text-[15px] leading-snug text-ink-soft">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {estimates.length > 0 && (
            <div className="mt-2 flex items-baseline justify-between rounded-xl bg-forest px-5 py-4 text-white">
              <p className="font-semibold">Total needed</p>
              <p className="font-display text-2xl font-bold tabular-nums text-gold">{formatMoney(total)}</p>
            </div>
          )}

          {needs.budgetPdf && (
            <a
              href={needs.budgetPdf.href}
              download
              target="_blank"
              rel="noopener"
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 font-semibold text-forest hover:bg-club-tint"
            >
              <FileDown className="size-5 shrink-0" aria-hidden />
              <span>
                Download full budget <span className="text-sm font-normal text-ink-soft">· {needs.budgetPdf.sizeLabel}</span>
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
