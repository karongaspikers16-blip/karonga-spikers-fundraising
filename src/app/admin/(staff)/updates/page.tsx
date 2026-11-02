import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { canEditPosts, getStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { photoUrl } from "@/lib/supabase/env";
import { UPDATE_SELECT, categoryLabel, coverPhoto, postDate, toPost, type UpdateRow } from "@/lib/updates";
import { VolleyballMark } from "@/components/ui/VolleyballMark";

export default async function AdminUpdatesPage() {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null; // the layout explains what is missing

  const { data, error } = await staff.supabase
    .from("updates")
    .select(UPDATE_SELECT)
    .order("created_at", { ascending: false });
  const posts = ((data as UpdateRow[] | null) ?? []).map(toPost);
  const canEdit = canEditPosts(staff.role);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none text-forest">Updates</h1>
        {canEdit && (
          <Link
            href="/admin/updates/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-club px-4 py-3 font-bold text-white hover:bg-forest"
          >
            <Plus className="size-5" aria-hidden /> New post
          </Link>
        )}
      </div>
      {!canEdit && (
        <p className="mt-2 text-sm text-ink-soft">You can view posts. Only the admin or secretary can create or change them.</p>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-gold-tint px-4 py-3 text-ink">
          Posts could not be loaded. Check your connection and refresh.
        </p>
      )}

      {!error && posts.length === 0 && (
        <div className="mt-6 rounded-2xl bg-white p-6 text-center ring-1 ring-line">
          <p className="font-semibold text-ink">No posts yet.</p>
          {canEdit && <p className="mt-1 text-sm text-ink-soft">Tap “New post” to share news from the team.</p>}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {posts.map((post) => {
          const cover = coverPhoto(post);
          return (
            <li key={post.id}>
              <Link
                href={`/admin/updates/${post.id}`}
                className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-line hover:ring-club"
              >
                <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-forest">
                  {cover ? (
                    <Image src={photoUrl(cover.storage_path)} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <VolleyballMark className="size-8 opacity-80" />
                  )}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        post.published ? "bg-club text-white" : "border border-dashed border-ink-soft text-ink-soft"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <span className="text-xs font-semibold text-club">{categoryLabel(post.category)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 font-semibold leading-snug text-ink">{post.title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {formatDate(postDate(post))} · {post.photos.length} {post.photos.length === 1 ? "photo" : "photos"}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
