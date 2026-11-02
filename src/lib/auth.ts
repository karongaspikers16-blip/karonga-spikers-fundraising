import { cache } from "react";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export type StaffRole = "admin" | "secretary" | "treasurer";

export const roleLabels: Record<StaffRole, string> = {
  admin: "Admin",
  secretary: "Secretary",
  treasurer: "Treasurer",
};

/** Admin and secretary can create, edit, publish and delete posts. Matches can_edit_posts() in schema.sql. */
export function canEditPosts(role: StaffRole | null | undefined) {
  return role === "admin" || role === "secretary";
}

/** Admin and treasurer record and verify contributions. Matches can_manage_money() in schema.sql. */
export function canManageMoney(role: StaffRole | null | undefined) {
  return role === "admin" || role === "treasurer";
}

/**
 * The signed-in admin user and their role, once per request.
 * Returns null when Supabase is not configured.
 */
export const getStaff = cache(async () => {
  await connection(); // admin pages are always rendered per request, never cached
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null, name: null };

  const { data } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  const role = data?.role && data.role in roleLabels ? (data.role as StaffRole) : null;
  return { supabase, user, role, name: (data?.full_name as string | null) ?? user.email ?? null };
});
