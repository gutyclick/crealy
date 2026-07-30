import { expect, test } from "@playwright/test";

test.describe("superficie pública de lanzamiento", () => {
  const pages = [
    ["/", "Crealy"],
    ["/pricing", "Precios"],
    ["/tools", "herramientas"],
    ["/login", "Iniciar sesión"],
    ["/signup", "Crear"],
    ["/help", "Ayuda"],
    ["/contact", "Contacto"],
    ["/privacy", "Privacidad"],
    ["/terms", "Términos"],
  ] as const;

  for (const [path, text] of pages) {
    test(`${path} responde y tiene contenido`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toContainText(text, {
        ignoreCase: true,
      });
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("una ruta privada redirige a autenticación", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("robots y sitemap no exponen rutas privadas", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /dashboard");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/dashboard");
    expect(sitemap).not.toContain("/api/");
    expect(sitemap).not.toContain("/privacy");
  });

  test("los borradores legales no se indexan", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("webhook e infraestructura interna rechazan llamadas no firmadas", async ({
    request,
  }) => {
    const resend = await request.post("/api/webhooks/resend", {
      data: { type: "email.delivered" },
    });
    expect(resend.status()).toBe(401);
    const worker = await request.get("/api/internal/jobs/tick");
    expect([401, 405]).toContain(worker.status());
  });
});
