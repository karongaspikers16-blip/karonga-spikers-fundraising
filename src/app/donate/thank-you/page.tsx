import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Home } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatMoney, shareLinks } from "@/lib/format";
import { createPublicSupabase } from "@/lib/supabase/public";
import { isClubTxRef } from "@/lib/paychangu";
import { DonateShell } from "@/components/DonateShell";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { RecheckSoon } from "@/components/RecheckSoon";

export const metadata: Metadata = { title: `Thank you | ${siteConfig.club.name}`, robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tx_ref?: string; try?: string }> };
type Receipt = { status: "pending" | "verified" | "rejected"; amount: number; first_name: string } | null;

export default async function ThankYouPage({ searchParams }: Props) {
  const { tx_ref: txRef, try: attempt } = await searchParams;
  const db = createPublicSupabase();
  let receipt: Receipt = null;
  if (db && isClubTxRef(txRef)) {
    const { data } = await db.rpc("paychangu_receipt", { p_tx_ref: txRef });
    receipt = (data as Receipt) ?? null;
  }

  const share = shareLinks(
    "/donate",
    `I have just supported ${siteConfig.club.shortName} on their way to the ${siteConfig.tournament.name}. Join me:`,
  );

  if (receipt?.status === "verified") {
    return (
      <DonateShell title="Thank you!" intro="Your contribution is confirmed.">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-1 size-7 shrink-0 text-club" aria-hidden />
          <div>
            <p className="font-display text-3xl font-bold text-forest">
              {receipt.first_name ? `${receipt.first_name}, w` : "W"}e received {formatMoney(Number(receipt.amount))}
            </p>
            <p className="mt-2 text-ink-soft">
              It already counts towards our total. Every kwacha brings the team closer to Mzuzu. Zikomo kwambiri!
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={share.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-club px-6 py-3.5 font-bold text-white hover:bg-forest"
          >
            <WhatsAppIcon className="size-5" /> Share on WhatsApp
          </a>
          <HomeButton />
        </div>
      </DonateShell>
    );
  }

  if (receipt?.status === "pending") {
    const tries = Number(attempt) || 0;
    const recheck = `/api/paychangu/callback?tx_ref=${encodeURIComponent(txRef!)}`;
    return (
      <DonateShell title="Almost there" intro="We are confirming your payment with PayChangu.">
        <div className="flex gap-3">
          <Clock className="mt-1 size-7 shrink-0 text-club" aria-hidden />
          <div>
            <p className="font-display text-2xl font-bold text-forest">
              Waiting for confirmation of {formatMoney(Number(receipt.amount))}
            </p>
            <p className="mt-2 text-ink-soft">
              If you approved the payment on your phone, this usually takes less than a minute. You do not need to pay
              again.
            </p>
          </div>
        </div>
        {tries < 6 && <RecheckSoon href={`${recheck}&try=${tries + 1}`} />}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={recheck}
            className="inline-flex items-center justify-center rounded-lg bg-club px-6 py-3.5 font-bold text-white hover:bg-forest"
          >
            Check again
          </a>
          <HomeButton />
        </div>
      </DonateShell>
    );
  }

  return (
    <DonateShell title="Payment not found" intro="We could not find a completed payment for this link.">
      <p className="text-ink-soft">If money left your account, please contact us on WhatsApp with your PayChangu receipt.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/donate"
          className="inline-flex items-center justify-center rounded-lg bg-club px-6 py-3.5 font-bold text-white hover:bg-forest"
        >
          Try again
        </Link>
        <HomeButton />
      </div>
    </DonateShell>
  );
}

/** Back to the campaign page, where the updated total and progress bar are. */
function HomeButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-6 py-3.5 font-bold text-forest hover:bg-club-tint"
    >
      <Home className="size-5" aria-hidden /> Back to home page
    </Link>
  );
}
