import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { createHmac } from "node:crypto";

const testUrl = process.env.E2E_SUPABASE_URL?.trim() || "";
const appUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const publishableKey = process.env.E2E_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
const secretKey = process.env.E2E_SUPABASE_SECRET_KEY?.trim() || "";
const explicitlyAllowed = process.env.E2E_ALLOW_REMOTE_TEST_PROJECT === "true";
const configured = explicitlyAllowed && Boolean(testUrl && publishableKey && secretKey) && testUrl === appUrl;

function totp(secret: string, counter = Math.floor(Date.now() / 30_000)) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.replaceAll("=", "").toUpperCase()) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error("invalid_totp_secret");
    bits += value.toString(2).padStart(5, "0");
  }
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((byte) => Number.parseInt(byte, 2)));
  const moving = Buffer.alloc(8);
  moving.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(moving).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return binary.toString().padStart(6, "0");
}

test.describe("flujos privados con Supabase de testing", () => {
  test.skip(!configured, "Requiere un proyecto Supabase E2E separado y E2E_ALLOW_REMOTE_TEST_PROJECT=true.");
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  let admin: SupabaseClient;
  const users = [
    { email: `crealy-e2e-primary-${Date.now()}@example.test`, password: `Crealy-E2E-${crypto.randomUUID()}!` },
    { email: `crealy-e2e-isolation-${Date.now()}@example.test`, password: `Crealy-E2E-${crypto.randomUUID()}!` },
  ];
  const userIds: string[] = [];
  let primaryTotpSecret = "";

  test.beforeAll(async () => {
    admin = createClient(testUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
    for (const candidate of users) {
      const { data, error } = await admin.auth.admin.createUser({ email: candidate.email, password: candidate.password, email_confirm: true });
      if (error || !data.user) throw error ?? new Error("e2e_user_creation_failed");
      userIds.push(data.user.id);
    }
    const userClient = createClient(testUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error: signInError } = await userClient.auth.signInWithPassword(users[0]);
    if (signInError) throw signInError;
    const { data: enrollment, error: enrollmentError } = await userClient.auth.mfa.enroll({ factorType: "totp", friendlyName: "Crealy E2E" });
    if (enrollmentError) throw enrollmentError;
    primaryTotpSecret = enrollment.totp.secret;
    const { error: verifyError } = await userClient.auth.mfa.challengeAndVerify({ factorId: enrollment.id, code: totp(primaryTotpSecret) });
    if (verifyError) throw verifyError;
    await userClient.auth.signOut();
  });

  test.afterAll(async () => {
    await Promise.all(userIds.map((id) => admin.auth.admin.deleteUser(id)));
  });

  test("inicia sesión y abre Create y Recreate sin compartir estado", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(users[0].email);
    await page.getByLabel("Contraseña", { exact: true }).fill(users[0].password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.goto("/create");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/recreate");
    await expect(page.getByRole("heading", { level: 1, name: /Recrea/i })).toBeVisible();
    await page.goto("/settings/billing");
    await expect(page.getByRole("heading", { name: /Plan y créditos/i })).toBeVisible();
  });

  test("recomienda MFA sin bloquear facturación ni datos de cuenta", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(users[1].email);
    await page.getByLabel("Contraseña", { exact: true }).fill(users[1].password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByText("Añade una capa extra de seguridad")).toBeVisible();
    await page.goto("/settings/billing");
    await expect(page).toHaveURL(/\/settings\/billing/);
    await expect(page.getByRole("heading", { name: /Plan y créditos/i })).toBeVisible();
    await page.goto("/settings/account");
    await expect(page).toHaveURL(/\/settings\/account/);
    await expect(page.getByRole("heading", { name: "Cuenta y datos" })).toBeVisible();
  });
});
