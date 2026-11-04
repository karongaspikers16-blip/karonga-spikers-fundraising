import { formatMoney, getProgress, shareLinks } from "@/lib/format";
import type { Campaign } from "@/lib/campaign";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { VolleyballMark } from "@/components/ui/VolleyballMark";
import { CopyButton } from "@/components/ui/CopyButton";
import { FacebookIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

type Props = { fundraising: Campaign["fundraising"]; supporterNames: string[]; contributeHref?: string };

/** Shown when more names than this have opted in; the rest are summarised as "and N more". */
const MAX_NAMES = 40;

export function FundraisingProgress({ fundraising, supporterNames, contributeHref = "#donate" }: Props) {
  const { percent, label, remaining } = getProgress(fundraising.raised, fundraising.target);
  const share = shareLinks();

  return (
    <section id="progress" aria-labelledby="progress-title" className="relative z-10 -mt-24 px-5 md:-mt-28">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-[0_24px_60px_-20px_rgba(14,38,61,0.35)] ring-1 ring-forest/5 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="progress-title" className="font-display text-2xl font-bold uppercase text-forest">
            Fundraising progress
          </h2>
          <SampleBadge show={fundraising.isSample} label="Sample figures" />
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <div>
            <p className="text-base font-medium text-ink-soft">Our target</p>
            <p className="font-display text-[clamp(3rem,9vw,5.75rem)] font-extrabold leading-[0.9] tabular-nums text-forest">
              {formatMoney(fundraising.target)}
            </p>
          </div>
          <p className="pb-1 font-display text-3xl font-bold text-club sm:text-4xl">
            {label} <span className="text-xl font-semibold text-ink-soft">raised</span>
          </p>
        </div>

        {/* Progress bar: the court line, with the ball marking how far we have come */}
        <div className="mt-8 pt-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${formatMoney(fundraising.raised)} raised of ${formatMoney(fundraising.target)}, ${label}`}
            className="relative h-5 rounded-full bg-mist ring-1 ring-inset ring-line"
          >
            {[25, 50, 75].map((tick) => (
              <span
                key={tick}
                aria-hidden
                className="absolute top-1/2 h-7 w-px -translate-y-1/2 bg-forest/15"
                style={{ left: `${tick}%` }}
              />
            ))}
            <div
              className="animate-fill-bar absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-forest to-club"
              style={{ width: `${percent}%` }}
            />
            <span
              aria-hidden
              className="animate-ride-bar absolute top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md"
              style={{ left: `${percent}%` }}
            >
              <VolleyballMark className="size-10" />
            </span>
          </div>
          <div aria-hidden className="mt-2 flex justify-between text-xs font-medium text-ink-soft tabular-nums">
            <span>0</span>
            <span>{formatMoney(fundraising.target)}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <dl className="grid grid-cols-1 gap-5 min-[400px]:grid-cols-2 sm:grid-cols-3 sm:gap-6">
            <div>
              <dt className="text-sm text-ink-soft">Raised so far</dt>
              <dd className="mt-1 whitespace-nowrap font-display text-2xl font-bold tabular-nums text-club sm:text-3xl">
                {formatMoney(fundraising.raised)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Still needed</dt>
              <dd className="mt-1 whitespace-nowrap font-display text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                {formatMoney(remaining)}
              </dd>
            </div>
            <div className="min-[400px]:col-span-2 sm:col-span-1">
              <dt className="text-sm text-ink-soft">
                {fundraising.contributions ? `${fundraising.contributions} contributions · updated` : "Last updated"}
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">{fundraising.lastUpdated}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 lg:items-end">
            <a
              href={contributeHref}
              className="inline-flex items-center justify-center rounded-lg bg-club px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-forest"
            >
              Contribute Now
            </a>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-soft">Share:</span>
              <a
                href={share.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-semibold text-forest hover:bg-club-tint"
              >
                <WhatsAppIcon className="size-4" /> WhatsApp
              </a>
              <a
                href={share.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-semibold text-forest hover:bg-club-tint"
              >
                <FacebookIcon className="size-4" /> Facebook
              </a>
              <CopyButton value={share.url} label="page link" />
            </div>
          </div>
        </div>

        {supporterNames.length > 0 && (
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="font-display text-xl font-bold text-forest">Thank you to our supporters</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {supporterNames.slice(0, MAX_NAMES).map((name) => (
                <li key={name} className="rounded-full bg-club-tint px-3 py-1 text-sm font-semibold text-forest">
                  {name}
                </li>
              ))}
              {supporterNames.length > MAX_NAMES && (
                <li className="rounded-full px-3 py-1 text-sm font-semibold text-ink-soft">
                  and {supporterNames.length - MAX_NAMES} more
                </li>
              )}
            </ul>
            <p className="mt-3 text-sm text-ink-soft">Supporters who chose to show their name. Thank you to everyone else too.</p>
          </div>
        )}
      </div>
    </section>
  );
}
