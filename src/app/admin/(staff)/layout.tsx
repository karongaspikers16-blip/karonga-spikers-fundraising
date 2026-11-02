import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getStaff, roleLabels } from "@/lib/auth";
import { signOut } from "@/app/admin/actions";
import { Logo } from "@/components/ui/Logo";
import { AdminNav } from "@/components/admin/AdminNav";

/** Everything under /admin except the login page: signed-in club staff only. */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  if (!staff) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-3xl font-bold text-forest">Admin area not set up</h1>
        <p className="mt-3 text-ink-soft">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, as described in README.md.
        </p>
      </main>
    );
  }
  if (!staff.user) redirect("/admin/login");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/admin" className="min-w-0">
            <Logo size={36} />
          </Link>
          <div className="flex items-center gap-2">
            {staff.role && (
              <span className="hidden rounded-full bg-club-tint px-2.5 py-1 text-xs font-semibold text-club min-[400px]:inline">
                {roleLabels[staff.role]}
              </span>
            )}
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="grid size-10 place-items-center rounded-lg text-forest hover:bg-club-tint"
              >
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
        </div>
        {staff.role && <AdminNav role={staff.role} />}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        {staff.role ? (
          children
        ) : (
          <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h1 className="font-display text-2xl font-bold text-forest">No role yet</h1>
            <p className="mt-2 text-ink-soft">
              You are signed in as {staff.user.email}, but this account has not been given the admin, secretary or treasurer
              role. Ask the club to add it in Supabase (see README.md).
            </p>
          </div>
        )}
      </main>
    </>
  );
}
