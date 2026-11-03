import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FundraisingProgress } from "@/components/FundraisingProgress";
import { WhySupport } from "@/components/WhySupport";
import { DonationMethods } from "@/components/DonationMethods";
import { SponsorshipPackages } from "@/components/SponsorshipPackages";
import { Journey } from "@/components/Journey";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { LatestUpdates } from "@/components/LatestUpdates";
import { getPublishedUpdates } from "@/lib/updates-data";
import { DailyChallenge } from "@/components/DailyChallenge";
import { getCampaign } from "@/lib/campaign";
import { getChallenge } from "@/lib/challenge-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Figures and news come from Supabase; refresh the cached page at most once a minute.
export const revalidate = 60;

export default async function HomePage() {
  const [campaign, { data: latest }, challenge] = await Promise.all([
    getCampaign(),
    getPublishedUpdates(3),
    getChallenge(),
  ]);

  return (
    <>
      <Navbar showUpdates={latest.length > 0} />
      <main>
        <Hero />
        <FundraisingProgress fundraising={campaign.fundraising} supporterNames={campaign.supporterNames} />
        {challenge?.enabled && challenge.days.length > 0 && <DailyChallenge challenge={challenge} />}
        <WhySupport />
        <LatestUpdates posts={latest} />
        <DonationMethods
          payments={campaign.payments}
          contact={campaign.contact}
          showReportForm={isSupabaseConfigured}
          minAmount={campaign.fundraising.minContribution}
        />
        <SponsorshipPackages sponsors={campaign.sponsors} whatsappNumber={campaign.contact.whatsappNumber} />
        <Journey currentStep={campaign.journeyStep} />
        <Contact contact={campaign.contact} />
      </main>
      <Footer contact={campaign.contact} />
    </>
  );
}
