"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type LoginState = { error: string } | null;

export async function signIn(_: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "The admin area is not set up yet." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.status === 400 ? "That email and password don't match. Try again." : "Could not sign in. Check your connection.",
    };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}
