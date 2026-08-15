import { createHmac } from "node:crypto";

import { expect, test } from "@playwright/test";

import {
  adminClient,
  authenticatedE2EConfigured,
  cleanupStaleTestUsers,
  createConfirmedUser,
  findUserByEmail,
  login,
  uniqueTestUser,
  userClient,
} from "./support/authenticated-test-project";

function totp(secret: string, counter = Math.floor(Date.now() / 30_000)) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.replaceAll("=", "").toUpperCase()) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error("invalid_totp_secret");
    bits += value.toString(2).padStart(5, "0");
  }
  const key = Buffer.from(
    (bits.match(/.{8}/g) ?? []).map((byte) => Number.parseInt(byte, 2)),
  );
  const moving = Buffer.alloc(8);
  moving.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(moving).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return binary.toString().padStart(6, "0");
}

test.describe("flujos privados con Supabase de testing", () => {
  test.skip(
    !authenticatedE2EConfigured,
    "Requiere un proyecto Supabase E2E separado y autorizado.",
  );
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  let admin: ReturnType<typeof adminClient>;
  const primary = uniqueTestUser("primary");
  const isolated = uniqueTestUser("isolation");
  const createdUserIds = new Set<string>();
  let primaryTotpSecret = "";

  test.beforeAll(async () => {
    admin = adminClient();
    await cleanupStaleTestUsers(admin);
    await createConfirmedUser(admin, primary);
    await createConfirmedUser(admin, isolated);
    createdUserIds.add(primary.id!);
    createdUserIds.add(isolated.id!);

    const client = userClient();
    const { error: signInError } = await client.auth.signInWithPassword(primary);
    if (signInError) throw signInError;
    const { data: enrollment, error: enrollmentError } =
      await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Crealy E2E",
      });
    if (enrollmentError) throw enrollmentError;
    primaryTotpSecret = enrollment.totp.secret;
    const { error: verifyError } = await client.auth.mfa.challengeAndVerify({
      factorId: enrollment.id,
      code: totp(primaryTotpSecret),
    });
    if (verifyError) throw verifyError;
    await client.auth.signOut();
  });

  test.afterAll(async () => {
    await Promise.all(
      [...createdUserIds].map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  test("registra una cuenta por correo con consentimiento obligatorio", async ({
    page,
  }) => {
    const registered = uniqueTestUser("signup");
    await page.goto("/signup");
    await page
      .getByRole("button", { name: "Registrarme con correo" })
      .click();
    await page.getByLabel("Nombre").fill("Registro E2E");
    await page.getByLabel("Correo electrónico").fill(registered.email);
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill(registered.password);
    await page.getByLabel("Confirmar contraseña").fill(registered.password);
    await page
      .getByRole("checkbox", { name: /Acepto los términos de uso/i })
      .check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/(dashboard|verify-email)/, {
      timeout: 20_000,
    });

    const created = await findUserByEmail(admin, registered.email);
    expect(created).not.toBeNull();
    createdUserIds.add(created!.id);
    if (!created!.email_confirmed_at) {
      const { error } = await admin.auth.admin.updateUserById(created!.id, {
        email_confirm: true,
      });
      expect(error).toBeNull();
    }
  });

  for (const provider of ["Google", "Discord"] as const) {
    test(`entrega el registro a ${provider} con términos aceptados`, async ({
      page,
    }) => {
      const authorizeRequest = page.waitForRequest((request) =>
        request.url().includes("/auth/v1/authorize"),
      );
      await page.route("**/auth/v1/authorize**", async (route) => {
        await route.fulfill({ status: 200, body: "OAuth handoff E2E" });
      });
      await page.goto("/signup");
      await page
        .getByRole("button", { name: `Continuar con ${provider}` })
        .click();
      await page
        .getByRole("checkbox", { name: /Acepto los términos de uso/i })
        .check();
      await page
        .getByRole("button", { name: `Continuar con ${provider}` })
        .click();

      const request = await authorizeRequest;
      expect(new URL(request.url()).searchParams.get("provider")).toBe(
        provider.toLowerCase(),
      );
    });
  }

  test("inicia y cierra sesión sin dejar acceso privado", async ({ page }) => {
    await login(page, isolated);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("button", { name: "Abrir menú de usuario" }).click();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login\?signedOut=1/, { timeout: 20_000 });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("abre Create y Recreate como superficies independientes", async ({
    page,
  }) => {
    await login(page, isolated);
    await page.goto("/create");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Crear miniatura/i }),
    ).toBeVisible();

    await page.goto("/recreate");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Una referencia clara. Un resultado hecho para ti.",
    );
    await expect(page.getByText("Elige el tipo de pieza")).toBeVisible();
    await expect(
      page.getByText("Sube el diseño que quieres adaptar", { exact: false }),
    ).toBeVisible();
  });

  test("liga la opinión y una corrección a la generación evaluada", async ({
    page,
  }) => {
    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({
        user_id: isolated.id!,
        title: "Resultado con opinión E2E",
        content_type: "thumbnail",
      })
      .select("id")
      .single();
    expect(projectError).toBeNull();
    const { data: generation, error: generationError } = await admin
      .from("generations")
      .insert({
        project_id: project!.id,
        user_id: isolated.id!,
        client_request_id: crypto.randomUUID(),
        status: "completed",
        user_prompt: "Miniatura sobre hábitos de productividad",
        content_type: "thumbnail",
        requested_format: "thumbnail-standard",
        output_size: "1280x720",
        style: "auto",
        quality: "fast",
        color_preference: "auto",
        storage_path: `${isolated.id}/e2e/feedback.png`,
        mime_type: "image/png",
        width: 1280,
        height: 720,
        completed_at: new Date().toISOString(),
        generation_metadata: {
          creationMode: "create",
          thumbnailPreset: "impactful",
          evaluationScore: 82,
          evaluationProblems: ["El texto pierde fuerza a tamaño pequeño."],
        },
      })
      .select("id")
      .single();
    expect(generationError).toBeNull();

    await login(page, isolated);
    await page.goto(`/generations/${generation!.id}`);
    await expect(
      page.getByRole("heading", { name: "¿Este resultado te sirve?" }),
    ).toBeVisible();
    const feedbackEndpoint = `**/api/generations/${generation!.id}/feedback`;
    await page.route(feedbackEndpoint, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          feedback: {
            verdict: "not_useful",
            reasons: [],
            comment: null,
            correctionRequested: false,
            correctionRequest: null,
            updatedAt: new Date().toISOString(),
          },
        }),
      });
    });
    await page.getByRole("button", { name: "No me sirve" }).click();
    await page.getByRole("button", { name: "Texto", exact: true }).click();
    await expect(
      page.getByText("Valoración guardada. Tienes detalles sin guardar."),
    ).toBeVisible();
    await page.unroute(feedbackEndpoint);
    await page
      .getByRole("textbox", { name: "Comentario Opcional" })
      .fill("La idea funciona, pero el texto no se lee con claridad.");
    await page.getByLabel("Solicitar una corrección concreta").check();
    await page
      .getByLabel("Indica exactamente qué debe cambiar")
      .fill("Mantén la composición y reemplaza el titular por uno más corto.");
    if (process.env.E2E_CAPTURE_SCREENSHOTS === "true") {
      await page.waitForTimeout(400);
      await page.screenshot({
        path: ".codex/artifacts/generation-feedback-desktop.png",
        fullPage: false,
      });
    }
    await page
      .getByRole("button", { name: "Guardar y solicitar corrección" })
      .click();
    await expect(
      page.getByText("Opinión guardada y corrección solicitada."),
    ).toBeVisible();

    const { data: saved, error: savedError } = await admin
      .from("generation_feedback")
      .select(
        "verdict, reasons, correction_requested, configuration_snapshot, automatic_evaluation_snapshot",
      )
      .eq("generation_id", generation!.id)
      .single();
    expect(savedError).toBeNull();
    expect(saved?.verdict).toBe("not_useful");
    expect(saved?.reasons).toEqual(["text"]);
    expect(saved?.correction_requested).toBe(true);
    expect(saved?.configuration_snapshot).toMatchObject({
      contentType: "thumbnail",
      creationMode: "create",
      thumbnailPreset: "impactful",
    });
    expect(saved?.automatic_evaluation_snapshot).toMatchObject({
      evaluationScore: 82,
    });

    const primaryClient = userClient();
    const { error: signInError } = await primaryClient.auth.signInWithPassword(
      primary,
    );
    expect(signInError).toBeNull();
    const { data: leakedFeedback, error: rlsError } = await primaryClient
      .from("generation_feedback")
      .select("id")
      .eq("generation_id", generation!.id);
    expect(rlsError).toBeNull();
    expect(leakedFeedback).toEqual([]);
    await primaryClient.auth.signOut();
  });

  test("reserva créditos y los devuelve de forma atómica", async () => {
    const referenceId = crypto.randomUUID();
    const { error: grantError } = await admin.rpc("grant_credits_internal", {
      p_user_id: isolated.id!,
      p_source_type: "promotion",
      p_source_reference: `e2e:${crypto.randomUUID()}`,
      p_amount: 5,
      p_expires_at: null,
      p_description: "Créditos para prueba E2E",
    });
    expect(grantError).toBeNull();
    const { data: before } = await admin
      .from("credit_accounts")
      .select("available_balance, reserved_balance")
      .eq("user_id", isolated.id!)
      .single();

    const { data: reservation, error: reserveError } = await admin.rpc(
      "reserve_credits_internal",
      {
        p_user_id: isolated.id!,
        p_amount: 2,
        p_reference_type: "generation",
        p_reference_id: referenceId,
        p_idempotency_key: `generation:${referenceId}`,
      },
    );
    expect(reserveError).toBeNull();
    expect(reservation?.[0]?.credits_remaining).toBe(
      before!.available_balance - 2,
    );

    const { data: released, error: releaseError } = await admin.rpc(
      "release_reserved_credits_internal",
      {
        p_user_id: isolated.id!,
        p_reservation_id: reservation![0].reservation_id,
      },
    );
    expect(releaseError).toBeNull();
    expect(released).toBe(before!.available_balance);
    const { data: after } = await admin
      .from("credit_accounts")
      .select("available_balance, reserved_balance")
      .eq("user_id", isolated.id!)
      .single();
    expect(after).toEqual(before);
  });

  test("un webhook firmado es idempotente y un plan activo aparece en Billing", async ({
    page,
    request,
  }) => {
    const webhookSecret = process.env.E2E_STRIPE_WEBHOOK_SECRET!;
    const timestamp = Math.floor(Date.now() / 1000);
    const eventId = `evt_e2e_${crypto.randomUUID().replaceAll("-", "")}`;
    const payload = JSON.stringify({
      id: eventId,
      object: "event",
      api_version: "2026-06-30.basil",
      created: timestamp,
      data: { object: { id: `cs_${eventId}`, object: "checkout.session" } },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: "checkout.session.expired",
    });
    const digest = createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    const headers = {
      "content-type": "application/json",
      "stripe-signature": `t=${timestamp},v1=${digest}`,
    };
    const first = await request.post("/api/webhooks/stripe", {
      data: payload,
      headers,
    });
    const second = await request.post("/api/webhooks/stripe", {
      data: payload,
      headers,
    });
    expect(first.status()).toBe(200);
    expect(await first.json()).toEqual({ received: true, duplicate: false });
    expect(await second.json()).toEqual({ received: true, duplicate: true });

    const subscriptionId = `sub_e2e_${crypto.randomUUID().replaceAll("-", "")}`;
    const now = new Date();
    const { error: subscriptionError } = await admin.from("subscriptions").insert({
      user_id: isolated.id!,
      stripe_customer_id: `cus_e2e_${crypto.randomUUID().replaceAll("-", "")}`,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: "price_e2e_creator",
      stripe_product_id: "prod_e2e_creator",
      plan_key: "pro",
      status: "active",
      currency: "usd",
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
      cancel_at_period_end: false,
      last_stripe_event_created_at: now.toISOString(),
      livemode: false,
    });
    expect(subscriptionError).toBeNull();
    await login(page, isolated);
    await page.goto("/settings/billing");
    await expect(
      page.getByRole("heading", { level: 2, name: "Creator" }),
    ).toBeVisible();
    await admin
      .from("subscriptions")
      .delete()
      .eq("stripe_subscription_id", subscriptionId);
  });

  test("exige aislamiento de proyectos y descargas entre usuarios", async ({
    page,
  }) => {
    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({
        user_id: primary.id!,
        title: "Proyecto privado E2E",
        content_type: "youtube-thumbnail",
      })
      .select("id")
      .single();
    expect(projectError).toBeNull();
    const { data: generation, error: generationError } = await admin
      .from("generations")
      .insert({
        project_id: project!.id,
        user_id: primary.id!,
        client_request_id: crypto.randomUUID(),
        status: "completed",
        user_prompt: "Miniatura privada para validar aislamiento E2E",
        content_type: "youtube-thumbnail",
        requested_format: "youtube-16-9",
        output_size: "1280x720",
        style: "auto",
        quality: "fast",
        color_preference: "auto",
        storage_path: `${primary.id}/e2e/private.png`,
        mime_type: "image/png",
        width: 1280,
        height: 720,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    expect(generationError).toBeNull();

    const isolatedClient = userClient();
    const { error: signInError } = await isolatedClient.auth.signInWithPassword(
      isolated,
    );
    expect(signInError).toBeNull();
    const { data: leakedRows, error: rlsError } = await isolatedClient
      .from("generations")
      .select("id")
      .eq("id", generation!.id);
    expect(rlsError).toBeNull();
    expect(leakedRows).toEqual([]);
    await isolatedClient.auth.signOut();

    await login(page, isolated);
    const response = await page.request.get(
      `/api/generations/${generation!.id}/download`,
    );
    expect(response.status()).toBe(404);
  });

  test("completa el desafío MFA y conserva las áreas no sensibles disponibles", async ({
    page,
  }) => {
    await login(page, primary);
    await page.goto("/mfa-challenge?next=%2Fsettings%2Fsecurity");
    await page
      .getByLabel("Código de autenticación")
      .fill(totp(primaryTotpSecret));
    await page.getByRole("button", { name: "Verificar y continuar" }).click();
    await expect(page).toHaveURL(/\/settings\/security/, { timeout: 20_000 });
    await page.goto("/settings/billing");
    await expect(
      page.getByRole("heading", { name: /Plan y créditos/i }),
    ).toBeVisible();
    await page.goto("/settings/account");
    await expect(
      page.getByRole("heading", { name: "Cuenta y datos" }),
    ).toBeVisible();
  });
});
