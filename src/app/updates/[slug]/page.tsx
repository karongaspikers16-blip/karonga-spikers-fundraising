import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/format";
import { photoUrl } from "@/lib/supabase/env";
import { coverPhoto, excerpt, paragraphs, postDate, postPath } from "@/lib/updates";
import { getPublishedUpdate, getPublishedUpdates } from "@/lib/updates-data";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCampaign } from "@/lib/campaign";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { CategoryChip } from "@/components/updates/UpdateCard";
import { PhotoGallery } from "@/components/updates/PhotoGallery";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { data } = await getPublishedUpdates();
  return data.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await getPublishedUpdate(slug);
  if (!post) return { title: `Updates | ${siteConfig.club.name}` };

  const title = `${post.title} | ${siteConfig.club.shortName}`;
  const description = excerpt(post.body, 160) || `News from ${siteConfig.club.name}.`;
  const cover = coverPhoto(post);
  const images = cover
    ? [{ url: photoUrl(cover.storage_path), width: cover.width, height: cover.height, alt: cover.caption ?? post.title }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: postPath(post.slug) },
    openGraph: {
      title,
      description,
      url: postPath(post.slug),
      siteName: siteConfig.club.name,
      type: "article",
      publishedTime: postDate(post),
      ...(images && { images }),
    },
    twitter: { card: "summary_large_image", title, description, ...(images && { images }) },
  };
}

export default async function UpdatePage({ params }: Props) {
  const { slug } = await params;
  const { data: post, failed } = await getPublishedUpdate(slug);

  if (!post && !failed) notFound();

  return (
    <>
      <Navbar showUpdates />
      <main className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/updates" className="inline-flex items-center gap-1.5 font-semibold text-club hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> All updates
          </Link>

          {post ? (
            <article className="mt-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <CategoryChip post={post} />
                <time dateTime={postDate(post)} className="text-sm text-ink-soft">
                  {formatDate(postDate(post))}
                </time>
              </div>
              <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4rem)] font-extrabold uppercase leading-[0.95] text-forest">
                {post.title}
              </h1>

              {post.body && (
                <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink">
                  {paragraphs(post.body).map((p, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {post.photos.length > 0 && (
                <div className="mt-10">
                  <PhotoGallery photos={post.photos} title={post.title} />
                </div>
              )}

              {post.sponsors.length > 0 && (
                <div className="mt-10 rounded-2xl bg-white p-6 ring-1 ring-line">
                  <h2 className="font-display text-2xl font-bold text-forest">Thank you to</h2>
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {post.sponsors.map((sponsor) => (
                      <li
                        key={sponsor.id}
                        className={`rounded-xl px-5 py-3 font-semibold ${
                          sponsor.tier === "gold" ? "bg-forest text-lg text-gold" : "bg-mist text-forest ring-1 ring-line"
                        }`}
                      >
                        {sponsor.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ) : (
            <div className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
              <p className="font-display text-2xl font-bold text-forest">This update can&apos;t be loaded right now</p>
              <p className="mt-2 text-ink-soft">Please try again in a minute.</p>
            </div>
          )}

          <aside className="mt-12 rounded-2xl bg-forest p-6 text-white sm:p-8">
            <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.95]">Support the team</h2>
            <p className="mt-3 max-w-xl text-white/85">
              Help {siteConfig.club.shortName} get to the {siteConfig.tournament.name}, {siteConfig.tournament.dates} in{" "}
              {siteConfig.tournament.venue}.
            </p>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <a
                href="/#donate"
                className="inline-flex items-center justify-center rounded-lg bg-gold px-7 py-4 text-lg font-bold text-forest transition-colors hover:bg-white"
              >
                Support the team
              </a>
              <ShareButtons
                tone="dark"
                path={post ? postPath(post.slug) : `/updates/${slug}`}
                text={post ? `${post.title}: news from ${siteConfig.club.shortName}.` : siteConfig.club.shortName}
              />
            </div>
          </aside>
        </div>
      </main>
      <Footer contact={(await getCampaign()).contact} />
    </>
  );
}
