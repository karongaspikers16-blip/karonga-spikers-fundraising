import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage() {
  const staff = await getStaff();
  if (staff?.user) redirect("/admin");

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <Logo />
      <h1 className="mt-10 font-display text-4xl font-extrabold uppercase leading-[0.95] text-forest">Club admin</h1>
      {staff ? (
        <>
          <p className="mt-3 text-ink-soft">Sign in to post news and photos from the team.</p>
          <LoginForm />
        </>
      ) : (
        <p className="mt-3 text-ink-soft">
          The admin area is not set up yet. Add the Supabase settings described in README.md.
        </p>
      )}
    </main>
  );
}
