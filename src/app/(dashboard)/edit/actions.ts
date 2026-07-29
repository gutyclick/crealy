"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export async function editGeneration(formData: FormData) {
  await requireUser("/generations");
  const generationId = formData.get("generationId");
  if (typeof generationId !== "string") redirect("/generations");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "create_edit_session_from_generation",
    { p_generation_id: generationId },
  );
  if (error || !data?.[0]) redirect(`/generations/${generationId}?edit=error`);
  redirect(`/edit/${data[0].created_session_id}`);
}
