"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const user = await requireUser("/settings/profile");
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 60) redirect("/settings/profile?error=Nombre inválido");
  const supabase = await createClient();
  const [{ error: profileError }, { error: authError }] = await Promise.all([
    supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id),
    supabase.auth.updateUser({ data: { full_name: fullName } }),
  ]);
  if (profileError || authError) redirect("/settings/profile?error=No pudimos guardar los cambios");
  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  redirect("/settings/profile?saved=1");
}

export async function updateEmail(formData: FormData) {
  const user = await requireUser("/settings/profile");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === user.email) {
    redirect("/settings/profile?error=Correo inválido o sin cambios");
  }
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${siteUrl}/auth/callback?next=/settings/profile` },
  );
  if (error) redirect("/settings/profile?error=No pudimos iniciar el cambio de correo");
  redirect("/settings/profile?emailPending=1");
}

export async function updatePassword(formData: FormData) {
  await requireUser("/settings/security");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8 || password !== confirmation) {
    redirect("/settings/security?error=Revisa la contraseña y su confirmación");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/settings/security?error=No pudimos actualizar la contraseña");
  if (formData.get("closeOtherSessions") === "on") {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
    if (signOutError) redirect("/settings/security?error=La contraseña cambió, pero no pudimos cerrar las otras sesiones");
  }
  redirect("/settings/security?saved=1");
}

export async function closeOtherSessions() {
  await requireUser("/settings/security");
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) redirect("/settings/security?error=No pudimos cerrar las otras sesiones");
  redirect("/settings/security?sessionsClosed=1");
}

