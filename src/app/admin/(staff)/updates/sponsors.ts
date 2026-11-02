import type { SupabaseClient } from "@supabase/supabase-js";
import type { TierId } from "@/config/site";

/** Confirmed sponsors the secretary can thank in a post. */
export async function getConfirmedSponsors(db: SupabaseClient) {
  const { data } = await db.from("sponsors").select("id, name, tier").eq("confirmed", true).order("name");
  return (data ?? []) as { id: string; name: string; tier: TierId }[];
}
