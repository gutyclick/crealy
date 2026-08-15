import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("conversational editing is retired from product surfaces", () => {
  const featureConfig = read("src/config/product-features.ts");
  const desktopNavigation = read("src/components/dashboard/dashboard-navigation.tsx");
  const mobileNavigation = read("src/components/dashboard/mobile-app-navigation.tsx");
  const dashboard = read("src/components/dashboard/dashboard-home.tsx");
  const dashboardPage = read("src/app/(dashboard)/dashboard/page.tsx");
  const onboarding = read("src/components/onboarding/onboarding-flow.tsx");
  const generationDetail = read("src/app/(dashboard)/generations/[id]/page.tsx");

  assert.match(featureConfig, /conversationalEditing:\s*false/);
  for (const surface of [desktopNavigation, mobileNavigation, dashboard, onboarding]) {
    assert.doesNotMatch(surface, /["']\/edit(?:[/?"'])/);
  }
  assert.doesNotMatch(dashboardPage, /listRecentEditSessions|job_type[^\n]+edit/);
  assert.doesNotMatch(generationDetail, /editGeneration|Editar imagen/);
});

test("retired editing pages redirect and mutation endpoints fail closed", () => {
  for (const pagePath of [
    "src/app/(dashboard)/edit/page.tsx",
    "src/app/(dashboard)/edit/[sessionId]/page.tsx",
  ]) {
    const page = read(pagePath);
    assert.match(page, /redirect\("\/generations"\)/);
    assert.doesNotMatch(page, /EditWorkspace|ImageUpload|listRecentEditSessions/);
  }

  for (const routePath of [
    "src/app/api/edit-sessions/[sessionId]/archive/route.ts",
    "src/app/api/edit-sessions/[sessionId]/restore/route.ts",
    "src/app/api/edit-sessions/[sessionId]/versions/route.ts",
    "src/app/api/edit-versions/[versionId]/download/route.ts",
    "src/app/api/uploads/images/route.ts",
    "src/app/api/uploads/images/sign/route.ts",
    "src/app/api/uploads/images/finalize/route.ts",
  ]) {
    const route = read(routePath);
    assert.match(route, /PRODUCT_FEATURES\.conversationalEditing/);
    assert.match(
      route,
      /PRODUCT_FEATURES\.conversationalEditing[\s\S]{0,220}404/,
    );
  }
});
