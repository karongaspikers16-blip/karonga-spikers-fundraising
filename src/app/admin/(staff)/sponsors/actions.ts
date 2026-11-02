"use server";

import { revalidatePath } from "next/cache";
import type { TierId } from "@/config/site";
import { canEditPosts, getStaff } from "@/lib/auth";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIERS: TierId[] = ["gold", "silver", "bronze"];
const NOT_ALLOWED = "Only the admin or secretary can change sponsors.";

async function editorDb() {
  const staff = await getStaff();
  if (!staff?.user || !canEditPosts(staff.role)) return null;
  return staff.supabase;
}

/** Adds a sponsor, or saves changes when the form has an id. */
export async function saveSponsor(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const db = await editorDb();
  if (!db) return { ok: false, message: NOT_ALLOWED };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const tier = String(formData.get("tier") ?? "bronze") as TierId;
  const confirmed = formData.get("confirmed") === "on";
  if (!name || name.length > 120) return { ok: false, message: "Enter the sponsor's name (up to 120 characters)." };
  if (!TIERS.includes(tier)) return { ok: false, message: "Choose a tier." };
  if (id && !UUID.test(id)) return { ok: false, message: "Sponsor not found." };

  const fields = { name, tier, confirmed, updated_at: new Date().toISOString() };
  const { data, error } = id
    ? await db.from("sponsors").update(fields).eq("id", id).select("id").maybeSingle()
    : await db.from("sponsors").insert(fields).select("id").single();
  if (error || !data) return { ok: false, message: error ? "Could not save. Try again." : NOT_ALLOWED };

  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Saved." : `${name} added.` };
}

export async function deleteSponsor(id: string): Promise<ActionResult> {
  const db = await editorDb();
  if (!db || !UUID.test(id)) return { ok: false, message: NOT_ALLOWED };

  const { data, error } = await db.from("sponsors").delete().eq("id", id).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "Could not delete. Try again." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Sponsor removed." };
}
