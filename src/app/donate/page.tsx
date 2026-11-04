import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getCampaign } from "@/lib/campaign";
import { onlinePaymentsEnabled } from "@/lib/paychangu";
import { DonateShell } from "@/components/DonateShell";
import { DonateForm } from "@/components/DonateForm";

const title = `Support ${siteConfig.club.shortName}`;
const description = "Pay online with Airtel Money, TNM Mpamba or a card. Help us get to the National Tournament in Mzuzu.";

export const metadata: Metadata = {
  title: `${title} | ${siteConfig.club.name}`,
  description,
  alternates: { canonical: "/donate" },
  openGraph: { title, description, url: "/donate", siteName: siteConfig.club.name, type: "website" },
};

export const revalidate = 60;

export default async function DonatePage() {
  const campaign = await getCampaign();
  const enabled = onlinePaymentsEnabled();

  return (
    <DonateShell title={title} intro="Help us get to the National Tournament in Mzuzu.">
      {enabled ? (
        <>
          <p className="mb-6 text-ink-soft">
            Pay with <strong className="text-ink">Airtel Money, TNM Mpamba or a card</strong>. Your contribution is confirmed
            automatically and counts towards the total straight away.
          </p>
          <DonateForm minAmount={campaign.fundraising.minContribution} />
        </>
      ) : (
        <div>
          <p className="text-lg text-ink">Online payments are not available right now.</p>
          <p className="mt-2 text-ink-soft">You can still send money with Airtel Money, TNM Mpamba or a bank transfer.</p>
          <Link
            href="/#donate"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-club px-6 py-3.5 font-bold text-white hover:bg-forest"
          >
            See the payment details
          </Link>
        </div>
      )}
    </DonateShell>
  );
}
