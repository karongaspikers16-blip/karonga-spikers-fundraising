import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canManageMoney, getStaff } from "@/lib/auth";
import { ContributionForm } from "@/components/admin/ContributionForm";

export default async function NewContributionPage() {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;
  if (!canManageMoney(staff.role)) redirect("/admin");

  return (
    <>
      <Link href="/admin/contributions" className="inline-flex items-center gap-1.5 font-semibold text-club">
        <ArrowLeft className="size-4" aria-hidden /> Contributions
      </Link>
      <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-forest">Record contribution</h1>
      <p className="mt-2 text-sm text-ink-soft">For cash, bank or Mobile Money received directly by the club.</p>
      <div className="mt-6">
        <ContributionForm />
      </div>
    </>
  );
}
