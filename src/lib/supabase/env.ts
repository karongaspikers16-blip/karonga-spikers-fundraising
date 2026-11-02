/**
 * Supabase settings. Both values come from environment variables (see .env.example).
 * When either is missing the public site still works: news sections stay hidden
 * and the admin area explains what to set up.
 */
export const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const PHOTO_BUCKET = "update-photos";

/** Public URL of a photo in the update-photos bucket. */
export function photoUrl(storagePath: string) {
  const path = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
