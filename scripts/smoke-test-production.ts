const baseUrl = (
  process.argv[2] ||
  process.env.SMOKE_BASE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const checks = [
  { path: "/", status: [200], contains: "Crealy" },
  { path: "/login", status: [200], contains: "Iniciar sesión" },
  { path: "/signup", status: [200], contains: "Crear" },
  { path: "/pricing", status: [200], contains: "Precios" },
  { path: "/tools", status: [200], contains: "herramientas" },
  { path: "/contact", status: [200], contains: "Contacto" },
  { path: "/privacy", status: [200], contains: "Privacidad" },
  { path: "/robots.txt", status: [200], contains: "Sitemap" },
  { path: "/sitemap.xml", status: [200], contains: "<urlset" },
  { path: "/api/health", status: [200], contains: "ok" },
];

async function main() {
  let failed = false;
  for (const check of checks) {
    try {
      const response = await fetch(`${baseUrl}${check.path}`, {
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.text();
      const ok =
        check.status.includes(response.status) &&
        body.toLocaleLowerCase().includes(check.contains.toLocaleLowerCase());
      console.log(`${ok ? "PASS" : "FAIL"} ${check.path} (${response.status})`);
      if (!ok) failed = true;
    } catch (error) {
      console.error(
        `FAIL ${check.path} (${error instanceof Error ? error.message : "error"})`,
      );
      failed = true;
    }
  }

  if (failed) process.exitCode = 1;
}

void main();
