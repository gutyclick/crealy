"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

const reminderCookie = "crealy_mfa_reminder_dismissed";

async function hideForCurrentSession() {
  const cookieStore = await cookies();
  cookieStore.set(reminderCookie, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function dismissMfaReminder() {
  await requireUser();
  await hideForCurrentSession();
  revalidatePath("/", "layout");
}

export async function disableMfaReminder() {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ mfa_reminder_disabled: true })
    .eq("id", user.id);

  if (error) {
    console.error("[Crealy Auth]", {
      action: "disable_mfa_reminder",
      errorCode: error.code,
    });
  }

  await hideForCurrentSession();
  revalidatePath("/", "layout");
}
