import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { CampaignSettings } from "@/lib/campaign";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;
  if (staff.role !== "admin") redirect("/admin");

  const { data } = await staff.supabase.from("campaign_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) {
    return (
      <p role="alert" className="rounded-lg bg-gold-tint px-4 py-3 text-ink">
        Settings could not be loaded. Run supabase/schema.sql, then refresh.
      </p>
    );
  }
  const { updated_by, ...settings } = data as CampaignSettings & { updated_by: string | null };
  const { data: editor } = updated_by
    ? await staff.supabase.from("profiles").select("full_name").eq("id", updated_by).maybeSingle()
    : { data: null };

  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none text-forest">Settings</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Last changed {formatDate(settings.updated_at)}
        {editor?.full_name ? ` by ${editor.full_name}` : ""}.
      </p>
      <div className="mt-6">
        {/* The time input wants "20:00", the database gives "20:00:00". */}
        <SettingsForm settings={{ ...settings, challenge_cutoff: String(settings.challenge_cutoff ?? "24:00").slice(0, 5) }} />
      </div>
    </>
  );
}
