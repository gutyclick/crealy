import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("commercial SEO pages are indexable, internally linked and listed in the sitemap", () => {
  const sitemap = read("src/app/sitemap.ts");
  const footer = read("src/components/layout/footer.tsx");
  const slugs = [
    "generador-miniaturas-youtube",
    "crear-posts-redes-sociales",
    "generador-banners-portadas",
    "recreate-disenos",
  ];

  for (const slug of slugs) {
    assert.match(sitemap, new RegExp(`/${slug}`));
    assert.match(footer, new RegExp(`/${slug}`));
    const page = read(`src/app/${slug}/page.tsx`);
    assert.match(page, /createMetadata/);
    assert.match(page, /SeoProductPage/);
  }
});

test("sitemap dates follow the deployment instead of a stale fixed date", () => {
  const sitemap = read("src/app/sitemap.ts");
  assert.match(sitemap, /SITE_LAST_MODIFIED/);
  assert.match(sitemap, /Date\.now\(\)/);
  assert.doesNotMatch(sitemap, /2026-07-29/);
});

test("the animated hero prioritizes only its first useful image", () => {
  const hero = read("src/components/sections/hero-section.tsx");
  assert.match(hero, /prioritizeFirst && index === 0/);
  assert.match(hero, /priority=\{prioritizeFirst && index === 0\}/);
  assert.doesNotMatch(hero, /loading="eager"/);
});

test("Google and Bing ownership tokens are configurable without hard-coded secrets", () => {
  const layout = read("src/app/layout.tsx");
  const example = read(".env.example");
  assert.match(layout, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /NEXT_PUBLIC_BING_SITE_VERIFICATION/);
  assert.match(layout, /msvalidate\.01/);
  assert.match(example, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=/);
  assert.match(example, /NEXT_PUBLIC_BING_SITE_VERIFICATION=/);
});
