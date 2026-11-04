import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { createPublicSupabase } from "@/lib/supabase/public";
import { isClubTxRef, onlinePaymentsEnabled, settlePayment } from "@/lib/paychangu";
import { DonateShell } from "@/components/DonateShell";

export const metadata: Metadata = { title: `Payment not completed | ${siteConfig.club.name}`, robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tx_ref?: string | string[] }> };

/** PayChangu's return_url: the supporter cancelled, or the payment failed. */
export default async function CancelledPage({ searchParams }: Props) {
  // PayChangu may add its own tx_ref to the one in our link; both are the same.
  const raw = (await searchParams).tx_ref;
  const txRef = Array.isArray(raw) ? raw[0] : raw;
  const db = createPublicSupabase();

  if (db && isClubTxRef(txRef) && onlinePaymentsEnabled()) {
    // Never trust the redirect: ask PayChangu. If it was paid after all, count it.
    let result = "pending";
    try {
      result = await settlePayment(db, txRef, "cancelled");
    } catch (error) {
      console.error("Could not record a cancelled payment", error instanceof Error ? error.message : "unknown");
    }
    if (result === "confirmed" || result === "already") {
      redirect(`/api/paychangu/callback?tx_ref=${encodeURIComponent(txRef)}`);
    }
  }

  return (
    <DonateShell title="Payment not completed" intro="No money was taken.">
      <p className="text-ink">
        The payment was cancelled or did not go through. That happens: the network, a wrong PIN or a low balance.
      </p>
      <p className="mt-2 text-ink-soft">You can try again, or use Airtel Money, TNM Mpamba or the bank details instead.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/donate"
          className="inline-flex items-center justify-center rounded-lg bg-club px-6 py-3.5 font-bold text-white hover:bg-forest"
        >
          Try again
        </Link>
        <Link
          href="/#donate"
          className="inline-flex items-center justify-center rounded-lg border border-line px-6 py-3.5 font-bold text-forest hover:bg-club-tint"
        >
          Other ways to give
        </Link>
      </div>
    </DonateShell>
  );
}
