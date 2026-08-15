import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("mobile dashboard uses an app-like bottom navigation without duplicating routes", () => {
  const layout = readFileSync("src/app/(dashboard)/layout.tsx", "utf8");
  const navigation = readFileSync(
    "src/components/dashboard/mobile-app-navigation.tsx",
    "utf8",
  );

  assert.match(layout, /MobileAppNavigation/);
  assert.match(navigation, /fixed inset-x-0 bottom-0/);
  for (const route of [
    "/dashboard",
    "/create",
    "/recreate",
    "/generations",
    "/dashboard/tools",
  ]) {
    assert.match(navigation, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.match(navigation, /env\(safe-area-inset-bottom\)/);
});

test("mobile creation flows expose persistent stage navigation", () => {
  const create = readFileSync(
    "src/components/generation/generation-form.tsx",
    "utf8",
  );
  const recreate = readFileSync(
    "src/components/recreate/recreate-form.tsx",
    "utf8",
  );

  assert.match(create, /aria-label="Pasos de creación"/);
  assert.match(create, /creation-format/);
  assert.match(create, /creation-summary/);
  assert.match(recreate, /aria-label="Pasos de Recreate"/);
  assert.match(recreate, /recreate-reference/);
  assert.match(recreate, /recreate-submit/);
});

test("retired editing mode is absent from mobile navigation", () => {
  const navigation = readFileSync(
    "src/components/dashboard/mobile-app-navigation.tsx",
    "utf8",
  );

  assert.doesNotMatch(navigation, /href:\s*["']\/edit/);
  assert.doesNotMatch(navigation, /Editar una creación/);
});

test("creation notifications stay inside the mobile viewport", () => {
  const notifications = readFileSync(
    "src/components/dashboard/creation-notification-center.tsx",
    "utf8",
  );

  assert.match(notifications, /fixed inset-x-3 top-\[4\.75rem\]/);
  assert.match(notifications, /max-h-\[calc\(100dvh-6rem\)\]/);
  assert.match(notifications, /env\(safe-area-inset-bottom\)/);
});
