import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canEditPosts, getStaff } from "@/lib/auth";
import { getConfirmedSponsors } from "../sponsors";
import { UpdateForm } from "@/components/admin/UpdateForm";

export default async function NewUpdatePage() {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;
  if (!canEditPosts(staff.role)) redirect("/admin/updates");

  const sponsors = await getConfirmedSponsors(staff.supabase);

  return (
    <>
      <Link href="/admin/updates" className="inline-flex items-center gap-1.5 font-semibold text-club">
        <ArrowLeft className="size-4" aria-hidden /> All posts
      </Link>
      <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-forest">New post</h1>
      <p className="mt-2 text-sm text-ink-soft">Save the post first, then you can add photos.</p>
      <div className="mt-6">
        <UpdateForm sponsors={sponsors} />
      </div>
    </>
  );
}
