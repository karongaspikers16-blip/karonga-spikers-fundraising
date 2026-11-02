import { canEditPosts, getStaff } from "@/lib/auth";
import { SponsorManager, type SponsorRow } from "@/components/admin/SponsorManager";

export default async function SponsorsPage() {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;

  const { data, error } = await staff.supabase
    .from("sponsors")
    .select("id, name, tier, confirmed")
    .order("confirmed", { ascending: false })
    .order("name");
  const sponsors = (data ?? []) as SponsorRow[];
  const canEdit = canEditPosts(staff.role);

  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none text-forest">Sponsors</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Confirmed sponsors appear in “Thank you to our sponsors” on the website and can be thanked in posts.
        {!canEdit && " Only the admin or secretary can change them."}
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-gold-tint px-4 py-3 text-ink">
          Sponsors could not be loaded. Check your connection and refresh.
        </p>
      )}
      <div className="mt-6">
        {sponsors.length === 0 && !canEdit ? (
          <p className="rounded-2xl bg-white p-6 text-center text-ink-soft ring-1 ring-line">No sponsors yet.</p>
        ) : (
          <SponsorManager sponsors={sponsors} canEdit={canEdit} />
        )}
      </div>
    </>
  );
}
