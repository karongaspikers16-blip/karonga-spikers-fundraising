import Image from "next/image";
import Link from "next/link";
import { photoUrl } from "@/lib/supabase/env";
import { formatDate } from "@/lib/format";
import { categoryLabel, coverPhoto, excerpt, postDate, postPath, type UpdatePost } from "@/lib/updates";
import { VolleyballMark } from "@/components/ui/VolleyballMark";

export function CategoryChip({ post }: { post: Pick<UpdatePost, "category"> }) {
  return (
    <span className="inline-flex rounded-full bg-club-tint px-2.5 py-0.5 text-xs font-semibold text-club">
      {categoryLabel(post.category)}
    </span>
  );
}

/** News post card: cover photo, category, date, title and a two-line excerpt. */
export function UpdateCard({ post }: { post: UpdatePost }) {
  const cover = coverPhoto(post);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow hover:shadow-[0_18px_40px_-20px_rgba(14,38,61,0.35)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-forest">
        {cover ? (
          <Image
            src={photoUrl(cover.storage_path)}
            alt={cover.caption ?? ""}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <VolleyballMark className="size-14 opacity-80" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CategoryChip post={post} />
          <time dateTime={postDate(post)} className="text-sm text-ink-soft">
            {formatDate(postDate(post))}
          </time>
        </div>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-forest">
          <Link href={postPath(post.slug)} className="after:absolute after:inset-0 group-hover:underline">
            {post.title}
          </Link>
        </h3>
        {post.body && <p className="mt-2 line-clamp-2 leading-snug text-ink-soft">{excerpt(post.body, 220)}</p>}
      </div>
    </article>
  );
}
