"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const user = await requireUser("/settings/profile");
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 60) {
    redirect("/settings/profile?error=Nombre inválido");
  }
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
  redirect("/settings/security?saved=1");
}
