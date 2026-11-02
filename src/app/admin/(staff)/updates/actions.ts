"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { siteConfig, type UpdateCategory } from "@/config/site";
import { canEditPosts, getStaff } from "@/lib/auth";
import { PHOTO_BUCKET } from "@/lib/supabase/env";
import { UPDATE_CATEGORIES } from "@/lib/updates";

// Every action checks the role here AND relies on RLS in supabase/schema.sql,
// so a treasurer (or anyone else) is refused even if they call an action directly.

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = "Only the admin or secretary can change posts.";

async function editorDb() {
  const staff = await getStaff();
  if (!staff?.user || !canEditPosts(staff.role)) return null;
  return staff.supabase;
}

function refresh(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/updates");
  if (slug) revalidatePath(`/updates/${slug}`);
  revalidatePath("/admin/updates", "layout");
}

async function slugOf(db: NonNullable<Awaited<ReturnType<typeof editorDb>>>, updateId: string) {
  const { data } = await db.from("updates").select("slug").eq("id", updateId).maybeSingle();
  return (data?.slug as string | undefined) ?? null;
}

// ---- Posts ----------------------------------------------------------

export async function saveUpdate(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const db = await editorDb();
  if (!db) return { ok: false, message: NOT_ALLOWED };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "general") as UpdateCategory;
  const body = String(formData.get("body") ?? "").replace(/\r\n?/g, "\n").trim();
  const published = formData.get("published") === "on";
  const sponsorIds = formData.getAll("sponsors").map(String).filter((s) => UUID.test(s));

  if (!title) return { ok: false, message: "Give the post a title." };
  if (title.length > 120) return { ok: false, message: "Keep the title under 120 characters." };
  if (!UPDATE_CATEGORIES.includes(category)) return { ok: false, message: "Choose a category." };
  if (body.length > siteConfig.updates.maxBodyLength) {
    return { ok: false, message: `Keep the text under ${siteConfig.updates.maxBodyLength} characters.` };
  }

  const fields = { title, category, body, published };
  const isNew = !id;
  if (!isNew && !UUID.test(id)) return { ok: false, message: "Post not found." };

  const { data: saved, error } = isNew
    ? await db.from("updates").insert(fields).select("id, slug").single()
    : await db.from("updates").update(fields).eq("id", id).select("id, slug").maybeSingle();
  if (error || !saved) return { ok: false, message: error ? "Could not save. Try again." : NOT_ALLOWED };

  const { error: clearError } = await db.from("update_sponsors").delete().eq("update_id", saved.id);
  const { error: linkError } =
    !clearError && sponsorIds.length > 0
      ? await db.from("update_sponsors").insert(sponsorIds.map((sponsor_id) => ({ update_id: saved.id, sponsor_id })))
      : { error: null };

  refresh(saved.slug);
  if (isNew) redirect(`/admin/updates/${saved.id}?created=1`);
  if (clearError || linkError) return { ok: false, message: "Saved, but the sponsor list could not be updated." };
  return { ok: true, message: published ? "Saved and published." : "Saved as draft." };
}

export async function deleteUpdate(updateId: string): Promise<ActionResult> {
  const db = await editorDb();
  if (!db || !UUID.test(updateId)) return { ok: false, message: NOT_ALLOWED };

  // Collect every file in the post's folder first, including any upload that never got a database row.
  const { data: files } = await db.storage.from(PHOTO_BUCKET).list(updateId, { limit: 100 });
  const { data: deleted, error } = await db.from("updates").delete().eq("id", updateId).select("slug").maybeSingle();
  if (error || !deleted) return { ok: false, message: error ? "Could not delete. Try again." : NOT_ALLOWED };

  const paths = (files ?? []).map((f) => `${updateId}/${f.name}`);
  if (paths.length > 0) await db.storage.from(PHOTO_BUCKET).remove(paths);

  refresh(deleted.slug as string);
  redirect("/admin/updates");
}

// ---- Photos ---------------------------------------------------------

export type SavedPhoto = {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  width: number;
  height: number;
};

/** Records a photo that the browser has already uploaded to storage. */
export async function addPhoto(
  updateId: string,
  photo: { storagePath: string; width: number; height: number },
): Promise<{ ok: true; photo: SavedPhoto } | { ok: false; message: string }> {
  const db = await editorDb();
  if (!db || !UUID.test(updateId)) return { ok: false, message: NOT_ALLOWED };
  if (!new RegExp(`^${updateId}/[0-9a-f-]{36}\\.jpg$`).test(photo.storagePath)) {
    return { ok: false, message: "Unexpected photo file name." };
  }

  const { data: last } = await db
    .from("update_photos")
    .select("sort_order")
    .eq("update_id", updateId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("update_photos")
    .insert({
      update_id: updateId,
      storage_path: photo.storagePath,
      width: Math.round(photo.width),
      height: Math.round(photo.height),
      sort_order: ((last?.sort_order as number | undefined) ?? -1) + 1,
    })
    .select("id, storage_path, caption, sort_order, width, height")
    .single();
  if (error || !data) {
    return {
      ok: false,
      message: error?.message.includes("at most") ? `A post can have ${siteConfig.updates.maxPhotos} photos at most.` : "Could not save the photo.",
    };
  }

  refresh(await slugOf(db, updateId));
  return { ok: true, photo: data as SavedPhoto };
}

export async function updateCaption(photoId: string, caption: string): Promise<ActionResult> {
  const db = await editorDb();
  if (!db || !UUID.test(photoId)) return { ok: false, message: NOT_ALLOWED };
  const text = caption.trim().slice(0, 200) || null;

  const { data, error } = await db
    .from("update_photos")
    .update({ caption: text })
    .eq("id", photoId)
    .select("update_id")
    .maybeSingle();
  if (error || !data) return { ok: false, message: "Could not save the caption." };

  refresh(await slugOf(db, data.update_id as string));
  return { ok: true, message: "Caption saved." };
}

/** Saves a new photo order: `photoIds` lists every photo of the post, first to last. */
export async function reorderPhotos(updateId: string, photoIds: string[]): Promise<ActionResult> {
  const db = await editorDb();
  if (!db || !UUID.test(updateId) || !photoIds.every((id) => UUID.test(id))) return { ok: false, message: NOT_ALLOWED };

  const results = await Promise.all(
    photoIds.map((id, sort_order) =>
      db.from("update_photos").update({ sort_order }).eq("id", id).eq("update_id", updateId).select("id"),
    ),
  );
  if (results.some((r) => r.error || !r.data?.length)) return { ok: false, message: "Could not save the order." };

  refresh(await slugOf(db, updateId));
  return { ok: true, message: "Order saved." };
}

export async function setCoverPhoto(updateId: string, photoId: string): Promise<ActionResult> {
  const db = await editorDb();
  if (!db || !UUID.test(updateId) || !UUID.test(photoId)) return { ok: false, message: NOT_ALLOWED };

  const { data, error } = await db
    .from("updates")
    .update({ cover_photo_id: photoId })
    .eq("id", updateId)
    .select("slug")
    .maybeSingle();
  if (error || !data) return { ok: false, message: "Could not set the cover photo." };

  refresh(data.slug as string);
  return { ok: true, message: "Cover photo set." };
}

/** Deletes the photo's database row and its file in storage. */
export async function deletePhoto(photoId: string): Promise<ActionResult> {
  const db = await editorDb();
  if (!db || !UUID.test(photoId)) return { ok: false, message: NOT_ALLOWED };

  const { data, error } = await db
    .from("update_photos")
    .delete()
    .eq("id", photoId)
    .select("update_id, storage_path")
    .maybeSingle();
  if (error || !data) return { ok: false, message: "Could not delete the photo." };

  await db.storage.from(PHOTO_BUCKET).remove([data.storage_path as string]);
  refresh(await slugOf(db, data.update_id as string));
  return { ok: true, message: "Photo deleted." };
}
