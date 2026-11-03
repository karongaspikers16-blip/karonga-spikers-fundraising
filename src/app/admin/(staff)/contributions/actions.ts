"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ContributionMethod } from "@/config/site";
import { canManageMoney, getStaff } from "@/lib/auth";
import { CONTRIBUTION_METHODS, CONTRIBUTION_STATUSES, type ContributionStatus } from "@/lib/contributions";

// Role checks here mirror the RLS policies in supabase/schema.sql, which are the real guard.

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = "Only the admin or treasurer can change contributions.";

async function moneyDb() {
  const staff = await getStaff();
  if (!staff?.user || !canManageMoney(staff.role)) return null;
  return { db: staff.supabase, role: staff.role };
}

/** Totals, the progress bar and the supporters list are on every public page. */
function refreshPublic() {
  revalidatePath("/", "layout");
}

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "A contribution with this transaction ID is already recorded.";
  if (error.code === "23514") return "Some details are not valid. Check the amount and the fields.";
  return "Could not save. Try again.";
}

export async function saveContribution(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const auth = await moneyDb();
  if (!auth) return { ok: false, message: NOT_ALLOWED };

  const id = String(formData.get("id") ?? "");
  const donor_name = String(formData.get("donor_name") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").replace(/[\s,]/g, ""));
  const method = String(formData.get("method") ?? "") as ContributionMethod;
  const status = String(formData.get("status") ?? "verified") as ContributionStatus;
  const contributed_on = String(formData.get("contributed_on") ?? "");

  if (!donor_name) return { ok: false, message: "Enter the donor's name." };
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, message: "Enter the amount in whole kwacha." };
  if (!CONTRIBUTION_METHODS.includes(method)) return { ok: false, message: "Choose how it was paid." };
  if (!CONTRIBUTION_STATUSES.includes(status)) return { ok: false, message: "Choose a status." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(contributed_on)) return { ok: false, message: "Enter the date it was paid." };

  const fields = {
    donor_name,
    amount,
    method,
    status,
    contributed_on,
    reference: String(formData.get("reference") ?? "").trim() || null,
    donor_phone: String(formData.get("donor_phone") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    show_name: formData.get("show_name") === "on",
    display_name: String(formData.get("display_name") ?? "").trim().slice(0, 60) || null,
    school: String(formData.get("school") ?? "").trim().slice(0, 80) || null,
  };

  const { data, error } = id
    ? UUID.test(id)
      ? await auth.db.from("contributions").update(fields).eq("id", id).select("id").maybeSingle()
      : { data: null, error: null }
    : await auth.db.from("contributions").insert({ ...fields, source: "staff" }).select("id").single();

  if (error) return { ok: false, message: friendlyError(error) };
  if (!data) return { ok: false, message: NOT_ALLOWED };

  refreshPublic();
  redirect(`/admin/contributions?status=${status}&saved=1`);
}

export async function setContributionStatus(id: string, status: ContributionStatus): Promise<ActionResult> {
  const auth = await moneyDb();
  if (!auth || !UUID.test(id) || !CONTRIBUTION_STATUSES.includes(status)) return { ok: false, message: NOT_ALLOWED };

  const { data, error } = await auth.db.from("contributions").update({ status }).eq("id", id).select("id").maybeSingle();
  if (error) return { ok: false, message: friendlyError(error) };
  if (!data) return { ok: false, message: NOT_ALLOWED };

  refreshPublic();
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: status === "verified" ? "Verified: it now counts towards the total." : status === "rejected" ? "Rejected." : "Moved back to 'To check'.",
  };
}

export async function deleteContribution(id: string): Promise<ActionResult> {
  const auth = await moneyDb();
  if (!auth || auth.role !== "admin" || !UUID.test(id)) return { ok: false, message: "Only the admin can delete contributions." };

  const { data, error } = await auth.db.from("contributions").delete().eq("id", id).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "Could not delete. Try again." };

  refreshPublic();
  redirect("/admin/contributions?status=all");
}
