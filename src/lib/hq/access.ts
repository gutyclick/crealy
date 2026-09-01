import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMfaAssurance } from "@/lib/auth/mfa-assurance";

function csvSet(value: string | undefined) {
  return new Set(
    (value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireHqAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fhq");

  const requestHeaders = await headers();
  const requestHost = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  const configuredHost = (process.env.HQ_HOST || "hq.crealy.app").trim().toLowerCase();
  if (process.env.VERCEL_ENV === "production" && requestHost !== configuredHost) {
    notFound();
  }

  const allowedEmails = csvSet(process.env.HQ_ADMIN_EMAILS);
  const allowedIds = csvSet(process.env.HQ_ADMIN_USER_IDS);
  const email = user.email?.trim().toLowerCase() || "";
  if (!allowedIds.has(user.id.toLowerCase()) && !allowedEmails.has(email)) {
    notFound();
  }

  const assurance = await getMfaAssurance();
  if (assurance.currentLevel !== "aal2") {
    if (assurance.verifiedFactorIds.length > 0) {
      redirect("/mfa-challenge?next=%2Fhq");
    }
    redirect("/settings/security?mfaSetup=required&next=%2Fhq");
  }

  return user;
}
