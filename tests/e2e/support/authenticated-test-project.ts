import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

const testUrl = process.env.E2E_SUPABASE_URL?.trim() || "";
const appUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const publishableKey =
  process.env.E2E_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
const secretKey = process.env.E2E_SUPABASE_SECRET_KEY?.trim() || "";
const expectedProjectRef =
  process.env.E2E_SUPABASE_PROJECT_REF?.trim() || "";
const explicitlyAllowed =
  process.env.E2E_ALLOW_REMOTE_TEST_PROJECT === "true";

function projectRef(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}

export const authenticatedE2EConfigured = Boolean(
  explicitlyAllowed &&
    testUrl &&
    publishableKey &&
    secretKey &&
    expectedProjectRef &&
    testUrl === appUrl &&
    projectRef(testUrl) === expectedProjectRef,
);

if (
  process.env.E2E_REQUIRE_CONFIG === "true" &&
  !authenticatedE2EConfigured
) {
  throw new Error(
    "Authenticated E2E requires an explicitly allowed, matching Supabase test project and project ref.",
  );
}

export type TestUser = {
  id?: string;
  email: string;
  password: string;
};

export function uniqueTestUser(label: string): TestUser {
  return {
    // Use Crealy's real domain: Supabase's public signup validation can reject
    // reserved test TLDs even though admin-created users accept them.
    email: `e2e+${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@crealy.app`,
    password: `Crealy-E2E-${crypto.randomUUID()}!`,
  };
}

export function adminClient() {
  return createClient(testUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function userClient(): SupabaseClient {
  return createClient(testUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createConfirmedUser(
  admin: SupabaseClient,
  user: TestUser,
) {
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: "Crealy E2E" },
  });
  if (error || !data.user) {
    throw error ?? new Error("e2e_user_creation_failed");
  }
  user.id = data.user.id;
  return data.user;
}

export async function login(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 });
  if (new URL(page.url()).pathname === "/onboarding") {
    await page.goto("/dashboard");
  }
}

export async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find((user) => user.email === email);
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}
