import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { UpdatePost } from "@/lib/updates";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UpdateCard } from "@/components/updates/UpdateCard";

/** Homepage news: the three most recent published posts. Hidden until there is one. */
export function LatestUpdates({ posts }: { posts: UpdatePost[] }) {
  if (posts.length === 0) return null;

  return (
    <section id="updates" aria-labelledby="updates-title" className="bg-white px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="updates-title"
            title="Latest from the team"
            intro="Training, fundraising and the road to Mzuzu, posted by the club."
          />
          <Link
            href="/updates"
            className="inline-flex items-center gap-2 font-bold text-club hover:text-forest hover:underline"
          >
            See all updates <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <UpdateCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
