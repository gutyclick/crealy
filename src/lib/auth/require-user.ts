import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function requireUser(nextPath = "/dashboard") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}
