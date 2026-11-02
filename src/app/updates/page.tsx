import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getPublishedUpdates } from "@/lib/updates-data";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCampaign } from "@/lib/campaign";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UpdatesBrowser } from "@/components/updates/UpdatesBrowser";

export const revalidate = 60;

const title = `Updates | ${siteConfig.club.name}`;
const description = `News and photos from ${siteConfig.club.shortName} on the road to the ${siteConfig.tournament.name}.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/updates" },
  openGraph: { title, description, url: "/updates", siteName: siteConfig.club.name, type: "website" },
};

export default async function UpdatesPage() {
  const { data: posts, failed } = await getPublishedUpdates();

  return (
    <>
      <Navbar showUpdates={posts.length > 0} />
      <main className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            title="Latest from the team"
            intro="Training sessions, sponsor handovers, travel and match day: follow the club's preparation."
          />

          {posts.length > 0 ? (
            <UpdatesBrowser posts={posts} />
          ) : (
            <div className="mt-12 rounded-2xl bg-white p-8 text-center ring-1 ring-line sm:p-12">
              <p className="font-display text-2xl font-bold text-forest">
                {failed ? "Updates can't be loaded right now" : "No updates yet"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-ink-soft">
                {failed
                  ? "Please try again in a minute. You can still support the team below."
                  : "The club will post news and photos from training and travel here soon."}
              </p>
              <a
                href="/#donate"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-club px-6 py-3 font-bold text-white transition-colors hover:bg-forest"
              >
                Support the team
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer contact={(await getCampaign()).contact} />
    </>
  );
}
