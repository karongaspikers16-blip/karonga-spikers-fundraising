import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canManageMoney, getStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { statusLabels, type Contribution } from "@/lib/contributions";
import { ContributionForm } from "@/components/admin/ContributionForm";
import { DeleteContributionButton } from "@/components/admin/ContributionActions";

export default async function EditContributionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;
  if (!canManageMoney(staff.role)) redirect("/admin");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await staff.supabase.from("contributions").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const contribution = data as Contribution;

  return (
    <>
      <Link href="/admin/contributions" className="inline-flex items-center gap-1.5 font-semibold text-club">
        <ArrowLeft className="size-4" aria-hidden /> Contributions
      </Link>
      <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-forest">Edit contribution</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {statusLabels[contribution.status]} · {contribution.source === "public_form" ? "sent from the website" : "recorded by staff"} on{" "}
        {formatDate(contribution.created_at)}
      </p>
      <div className="mt-6 space-y-6">
        <ContributionForm contribution={contribution} />
        {staff.role === "admin" && <DeleteContributionButton id={contribution.id} />}
      </div>
    </>
  );
}
