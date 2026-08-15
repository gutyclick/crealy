import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

import {
  adminClient,
  authenticatedE2EConfigured,
  createConfirmedUser,
  login,
  uniqueTestUser,
} from "./support/authenticated-test-project";

test.describe("flujo móvil autenticado", () => {
  test.skip(
    !authenticatedE2EConfigured,
    "Requiere un proyecto Supabase E2E separado y autorizado.",
  );
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  let admin: ReturnType<typeof adminClient>;
  const mobileUser = uniqueTestUser("mobile");
  let mobileGenerationId = "";
  let mobileStoragePath = "";

  test.beforeAll(async () => {
    admin = adminClient();
    await createConfirmedUser(admin, mobileUser);
    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({
        user_id: mobileUser.id!,
        title: "Resultado móvil E2E",
        content_type: "thumbnail",
      })
      .select("id")
      .single();
    if (projectError) throw projectError;
    mobileStoragePath = `${mobileUser.id}/e2e/mobile-feedback.webp`;
    const { error: uploadError } = await admin.storage
      .from("generations")
      .upload(
        mobileStoragePath,
        readFileSync("public/images/examples/productivity.webp"),
        { contentType: "image/webp", upsert: true },
      );
    if (uploadError) throw uploadError;
    const { data: generation, error: generationError } = await admin
      .from("generations")
      .insert({
        project_id: project!.id,
        user_id: mobileUser.id!,
        client_request_id: crypto.randomUUID(),
        status: "completed",
        user_prompt: "Miniatura móvil para evaluar la experiencia",
        content_type: "thumbnail",
        requested_format: "thumbnail-standard",
        style: "automatic",
        quality: "standard",
        color_preference: "auto",
        storage_path: mobileStoragePath,
        mime_type: "image/webp",
        width: 1280,
        height: 720,
        completed_at: new Date().toISOString(),
        generation_metadata: { evaluationScore: 88 },
      })
      .select("id")
      .single();
    if (generationError) throw generationError;
    mobileGenerationId = generation!.id;
  });

  test.afterAll(async () => {
    if (mobileStoragePath) {
      await admin.storage.from("generations").remove([mobileStoragePath]);
    }
    if (mobileUser.id) await admin.auth.admin.deleteUser(mobileUser.id);
  });

  test("completa navegación, notificaciones, Create y Recreate sin desbordes", async ({
    page,
  }) => {
    await login(page, mobileUser);
    await expect(
      page.getByRole("navigation", { name: "Navegación principal móvil" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Actividad de creación" })
      .click();
    const notifications = page.locator("#creation-notifications");
    await expect(notifications).toBeVisible();
    const box = await notifications.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    await page
      .getByRole("button", { name: "Actividad de creación" })
      .click();

    for (const route of ["/dashboard", "/create", "/recreate"] as const) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
    }

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Una referencia clara. Un resultado hecho para ti.",
    );
    await page.getByRole("button", { name: "Más", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Más en Crealy" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await expect(page.getByRole("dialog", { name: "Más en Crealy" })).toBeHidden();

    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`/generations/${mobileGenerationId}`);
    await page.getByRole("button", { name: "No me sirve" }).click();
    await expect(
      page.getByRole("button", { name: "Me sirve", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "No me sirve", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("¿Qué deberíamos corregir?")).toBeVisible();
    await expect(
      page.getByLabel("Solicitar una corrección concreta"),
    ).toBeVisible();
    await expect(
      page.getByText("Enviar comentarios", { exact: true }),
    ).toHaveCount(0);
    if (process.env.E2E_CAPTURE_SCREENSHOTS === "true") {
      await page.waitForTimeout(400);
      await page.screenshot({
        path: ".codex/artifacts/generation-feedback-mobile.png",
        fullPage: false,
      });
    }
    const feedbackDimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(feedbackDimensions.document).toBeLessThanOrEqual(
      feedbackDimensions.viewport + 1,
    );
  });
});
