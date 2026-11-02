import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicSupabase } from "@/lib/supabase/public";
import { UPDATE_SELECT, toPost, type UpdatePost, type UpdateRow } from "@/lib/updates";

// Server-only reads for the public news pages. Helpers and types live in ./updates.ts.

type Result<T> = { data: T; failed: boolean };

async function fetchPublished(
  query: (db: SupabaseClient) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<Result<UpdatePost[]>> {
  const db = createPublicSupabase();
  if (!db) return { data: [], failed: false };
  try {
    const { data, error } = await query(db);
    if (error) throw error;
    return { data: ((data as UpdateRow[] | null) ?? []).map(toPost), failed: false };
  } catch (error) {
    console.error("Could not load updates from Supabase", error);
    return { data: [], failed: true };
  }
}

/** Published posts, newest first. `failed` is true when Supabase could not be reached. */
export const getPublishedUpdates = cache((limit?: number) =>
  fetchPublished((db) => {
    const q = db
      .from("updates")
      .select(UPDATE_SELECT)
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    return limit ? q.limit(limit) : q;
  }),
);

export const getPublishedUpdate = cache(async (slug: string): Promise<Result<UpdatePost | null>> => {
  const result = await fetchPublished((db) =>
    db.from("updates").select(UPDATE_SELECT).eq("published", true).eq("slug", slug).limit(1),
  );
  return { data: result.data[0] ?? null, failed: result.failed };
});
