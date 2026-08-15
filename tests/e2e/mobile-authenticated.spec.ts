import { expect, test } from "@playwright/test";

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

  test.beforeAll(async () => {
    admin = adminClient();
    await createConfirmedUser(admin, mobileUser);
  });

  test.afterAll(async () => {
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
    await page.getByRole("button", { name: "Más" }).click();
    await expect(page.getByRole("dialog", { name: "Más en Crealy" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await expect(page.getByRole("dialog", { name: "Más en Crealy" })).toBeHidden();
  });
});
