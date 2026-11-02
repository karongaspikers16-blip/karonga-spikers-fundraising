import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canEditPosts, getStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { photoUrl } from "@/lib/supabase/env";
import { UPDATE_SELECT, categoryLabel, coverPhoto, paragraphs, postDate, toPost, type UpdateRow } from "@/lib/updates";
import { getConfirmedSponsors } from "../sponsors";
import { UpdateForm } from "@/components/admin/UpdateForm";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { SharePanel } from "@/components/admin/SharePanel";
import { DeletePostButton } from "@/components/admin/DeletePostButton";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function EditUpdatePage({ params, searchParams }: Props) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await staff.supabase.from("updates").select(UPDATE_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = toPost(data as unknown as UpdateRow);
  const canEdit = canEditPosts(staff.role);

  return (
    <>
      <Link href="/admin/updates" className="inline-flex items-center gap-1.5 font-semibold text-club">
        <ArrowLeft className="size-4" aria-hidden /> All posts
      </Link>
      <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-forest">
        {canEdit ? "Edit post" : post.title}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {post.published ? "Published" : "Draft"} · {categoryLabel(post.category)} · {formatDate(postDate(post))}
      </p>

      <div className="mt-6 space-y-6">
        {created && canEdit && (
          <p role="status" className="rounded-lg bg-club-tint px-4 py-3 text-sm font-medium text-forest">
            Post saved. Now add photos below.
          </p>
        )}

        {post.published && <SharePanel slug={post.slug} title={post.title} />}

        {canEdit ? (
          <>
            <UpdateForm
              post={{
                id: post.id,
                title: post.title,
                category: post.category,
                body: post.body,
                published: post.published,
                sponsorIds: post.sponsors.map((s) => s.id),
              }}
              sponsors={await getConfirmedSponsors(staff.supabase)}
            />
            <PhotoManager updateId={post.id} initialPhotos={post.photos} initialCoverId={post.cover_photo_id} />
            <DeletePostButton updateId={post.id} />
          </>
        ) : (
          <ReadOnlyPost post={post} />
        )}
      </div>
    </>
  );
}

/** What the treasurer sees: the post without any editing controls. */
function ReadOnlyPost({ post }: { post: ReturnType<typeof toPost> }) {
  const cover = coverPhoto(post);
  return (
    <article className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      <div className="space-y-3 leading-relaxed text-ink">
        {post.body ? (
          paragraphs(post.body).map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))
        ) : (
          <p className="text-ink-soft">No text.</p>
        )}
      </div>
      {post.sponsors.length > 0 && (
        <p className="mt-4 text-sm text-ink-soft">Thanks: {post.sponsors.map((s) => s.name).join(", ")}</p>
      )}
      {post.photos.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {post.photos.map((photo) => (
            <li key={photo.id}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-forest">
                <Image src={photoUrl(photo.storage_path)} alt={photo.caption ?? ""} fill sizes="200px" className="object-cover" />
                {photo.id === cover?.id && (
                  <span className="absolute inset-x-0 bottom-0 bg-gold py-0.5 text-center text-[11px] font-bold text-forest">
                    Cover
                  </span>
                )}
              </div>
              {photo.caption && <p className="mt-1 text-xs text-ink-soft">{photo.caption}</p>}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
