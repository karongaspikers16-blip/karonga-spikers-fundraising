import { CreditCard, Handshake, Landmark, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { mailtoLink, whatsappLink } from "@/lib/format";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { CopyButton } from "@/components/ui/CopyButton";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { ContributionReportForm } from "@/components/ContributionReportForm";
import type { Campaign } from "@/lib/campaign";

function DetailRow({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-3 border-t border-white/15 py-3.5">
      <div className="min-w-0">
        <dt className="text-sm text-white/65">{label}</dt>
        <dd className="mt-0.5 break-words font-display text-2xl font-semibold leading-tight tabular-nums">{value}</dd>
      </div>
      {copy && <CopyButton value={value} label={label.toLowerCase()} tone="dark" />}
    </div>
  );
}

function MethodCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <article className="flex flex-col rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/15 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-gold text-forest">{icon}</span>
        <h3 className="font-display text-2xl font-bold">{title}</h3>
      </div>
      {children}
    </article>
  );
}

type Props = {
  payments: Campaign["payments"];
  contact: Campaign["contact"];
  /** Shows the "I have sent money" form (needs Supabase). */
  showReportForm: boolean;
  /** Smallest amount the form accepts. */
  minAmount: number;
  /** Shows the "Pay online" card (PayChangu is set up). */
  payOnline?: boolean;
};

export function DonationMethods({ payments, contact, showReportForm, minAmount, payOnline = false }: Props) {
  const { club } = siteConfig;
  const { bank } = payments;
  const reportMethods = [
    ...payments.mobileMoney.map((w) => ({
      value: w.provider.toLowerCase().includes("mpamba") ? "tnm_mpamba" : "airtel_money",
      label: w.provider,
    })),
    ...(bank.accountNumber ? [{ value: "bank", label: "Bank transfer" }] : []),
  ];

  return (
    <section id="donate" aria-labelledby="donate-title" className="bg-forest px-5 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="donate-title"
          tone="dark"
          title="Ways to contribute"
          intro="Choose whichever is easiest for you. Every kwacha goes towards getting the team to Mzuzu."
          aside={<SampleBadge show={payments.isSample} label="Sample payment details" tone="dark" />}
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {payOnline && (
            <article className="flex flex-col rounded-2xl bg-white/[0.06] p-6 ring-2 ring-gold sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-gold text-forest">
                  <CreditCard className="size-5" aria-hidden />
                </span>
                <h3 className="font-display text-2xl font-bold">Pay online</h3>
              </div>
              <p className="mt-6 font-display text-2xl font-semibold leading-tight">Airtel Money · TNM Mpamba · Card</p>
              <p className="mt-3 leading-relaxed text-white/80">
                Pay in a few taps on a secure PayChangu page. It is confirmed automatically, so there is nothing to record
                afterwards.
              </p>
              <a
                href="/donate"
                className="mt-auto inline-flex items-center justify-center rounded-lg bg-gold px-5 py-3.5 font-bold text-forest transition-colors hover:bg-white max-lg:mt-6 lg:mt-8"
              >
                Pay online now
              </a>
            </article>
          )}

          {payments.mobileMoney.map((wallet) => (
            <MethodCard key={wallet.number} icon={<Smartphone className="size-5" aria-hidden />} title="Mobile Money">
              <dl className="mt-6">
                <DetailRow label="Provider" value={wallet.provider} />
                <DetailRow label="Number" value={wallet.number} copy />
                <DetailRow label="Account name" value={wallet.accountName} />
              </dl>
            </MethodCard>
          ))}

          {bank.accountNumber && (
            <MethodCard icon={<Landmark className="size-5" aria-hidden />} title="Bank Transfer">
              <dl className="mt-6">
                <DetailRow label="Bank" value={bank.bankName} />
                <DetailRow label="Account number" value={bank.accountNumber} copy />
                <DetailRow label="Account name" value={bank.accountName} />
                {bank.branch && <DetailRow label="Branch" value={bank.branch} />}
                {bank.swiftCode && <DetailRow label="SWIFT code (from abroad)" value={bank.swiftCode} copy />}
              </dl>
            </MethodCard>
          )}

          <article className="flex flex-col rounded-2xl bg-gold p-6 text-forest sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-forest text-gold">
                <Handshake className="size-5" aria-hidden />
              </span>
              <h3 className="font-display text-2xl font-bold">Corporate Sponsorship</h3>
            </div>
            <p className="mt-6 font-display text-3xl font-extrabold uppercase leading-[0.95]">
              Partner with {club.shortName}
            </p>
            <p className="mt-4 leading-relaxed text-forest/85">
              Businesses and organisations are invited to partner with {club.shortName} through financial sponsorship,
              transport support, accommodation, meals, sports equipment, and other forms of assistance.
            </p>
            <a
              href={mailtoLink(
                `Sponsorship enquiry: ${club.shortName}`,
                `Hello ${club.shortName},\n\nOur organisation would like to discuss sponsoring the team for the national tournament.\n\nOrganisation:\nContact person:\nPhone:\n`,
                contact.email,
              )}
              className="mt-auto inline-flex items-center justify-center rounded-lg bg-forest px-5 py-3.5 font-bold text-white transition-colors hover:bg-ink max-lg:mt-6 lg:mt-8"
            >
              Contact Us About Sponsorship
            </a>
          </article>
        </div>

        {showReportForm && reportMethods.length > 0 && (
          <div id="report" className="mt-8 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/15 sm:p-7">
            <h3 className="font-display text-3xl font-extrabold uppercase leading-[0.95]">Record my contribution</h3>
            <p className="mt-2 max-w-2xl text-white/80">
              Sent money? Tell us here so we can thank you and count it. It takes less than a minute.
            </p>
            <div className="mt-6">
              <ContributionReportForm methods={reportMethods} minAmount={minAmount} />
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/15 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="max-w-2xl text-white/85">
            {showReportForm ? "Prefer WhatsApp? Send us your name and amount there instead." : payments.afterDonatingNote}
          </p>
          <a
            href={whatsappLink(
              `Hello ${club.shortName}, I have just sent a contribution.\nName:\nAmount:\nMethod:`,
              contact.whatsappNumber,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-bold text-forest transition-colors hover:bg-gold"
          >
            <WhatsAppIcon className="size-5" /> Confirm on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
