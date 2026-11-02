import { cache } from "react";
import { siteConfig, type SiteConfig, type TierId } from "@/config/site";
import { formatDate } from "@/lib/format";
import { createPublicSupabase } from "@/lib/supabase/public";

/**
 * Live campaign figures and details for the public page. With Supabase they come
 * from the admin dashboard (verified contributions, campaign settings, sponsors);
 * without it they fall back to src/config/site.ts.
 */
export type Campaign = {
  fundraising: SiteConfig["fundraising"] & { contributions: number | null };
  supporterNames: string[];
  payments: SiteConfig["payments"];
  contact: SiteConfig["contact"];
  journeyStep: number;
  sponsors: { name: string; tier: TierId }[];
};

export type CampaignSettings = {
  target: number;
  target_confirmed: boolean;
  journey_step: number;
  airtel_number: string | null;
  airtel_name: string | null;
  mpamba_number: string | null;
  mpamba_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_branch: string | null;
  bank_swift: string | null;
  payments_confirmed: boolean;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  facebook_url: string | null;
  contacts_confirmed: boolean;
  updated_at: string;
};

type Summary = {
  settings: CampaignSettings;
  raised: number;
  contributions: number;
  last_verified_at: string | null;
  names: string[];
  sponsors: { name: string; tier: TierId }[];
};

function fromConfig(): Campaign {
  return {
    fundraising: { ...siteConfig.fundraising, contributions: null },
    supporterNames: [],
    payments: siteConfig.payments,
    contact: siteConfig.contact,
    journeyStep: siteConfig.journey.currentStep,
    sponsors: siteConfig.sponsorship.currentSponsors,
  };
}

function fromSummary(summary: Summary): Campaign {
  const s = summary.settings;
  const wallets = [
    { provider: "Airtel Money", number: s.airtel_number, accountName: s.airtel_name },
    { provider: "TNM Mpamba", number: s.mpamba_number, accountName: s.mpamba_name },
  ]
    .filter((w) => w.number)
    .map((w) => ({ provider: w.provider, number: w.number!, accountName: w.accountName ?? siteConfig.club.name }));

  return {
    fundraising: {
      isSample: !s.target_confirmed,
      currency: siteConfig.fundraising.currency,
      target: Number(s.target),
      raised: Number(summary.raised),
      lastUpdated: formatDate(summary.last_verified_at ?? s.updated_at),
      contributions: Number(summary.contributions),
    },
    supporterNames: summary.names,
    payments: {
      isSample: !s.payments_confirmed,
      afterDonatingNote: siteConfig.payments.afterDonatingNote,
      mobileMoney: wallets,
      bank: {
        bankName: s.bank_name ?? "",
        accountNumber: s.bank_account_number ?? "",
        accountName: s.bank_account_name ?? siteConfig.club.name,
        branch: s.bank_branch,
        swiftCode: s.bank_swift,
      },
    },
    contact: {
      isSample: !s.contacts_confirmed,
      phoneDisplay: s.contact_phone ?? siteConfig.contact.phoneDisplay,
      whatsappNumber: s.contact_whatsapp ?? siteConfig.contact.whatsappNumber,
      email: s.contact_email ?? siteConfig.contact.email,
      facebookName: siteConfig.contact.facebookName,
      facebookUrl: s.facebook_url ?? siteConfig.contact.facebookUrl,
    },
    journeyStep: s.journey_step,
    sponsors: summary.sponsors,
  };
}

/**
 * When Supabase cannot be reached while a cached page is being refreshed, this
 * throws so Next.js keeps serving the last good page. During `next build` it
 * falls back to site.ts instead, so a build never fails because of the network.
 */
export const getCampaign = cache(async (): Promise<Campaign> => {
  const db = createPublicSupabase();
  if (!db) return fromConfig();
  try {
    const { data, error } = await db.rpc("campaign_summary");
    if (error) throw error;
    if (!data?.settings) return fromConfig();
    return fromSummary(data as Summary);
  } catch (error) {
    console.error("Could not load campaign figures from Supabase", error);
    if (process.env.NEXT_PHASE === "phase-production-build") return fromConfig();
    throw new Error("Campaign figures are temporarily unavailable");
  }
});
