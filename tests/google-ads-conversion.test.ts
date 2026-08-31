import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("Google Ads loads globally only after explicit consent", () => {
  const layout = read("src/app/layout.tsx");
  const provider = read("src/components/analytics/google-ads-provider.tsx");
  const config = read("src/config/google-ads.ts");

  assert.match(layout, /<GoogleAdsProvider \/>/);
  assert.match(provider, /consent === "granted"/);
  assert.match(provider, /googletagmanager\.com\/gtm\.js/);
  assert.match(config, /GTM-ND5L97KW/);
  assert.match(config, /1487981196421629/);
  assert.match(config, /crealy_marketing_consent_v2/);
  assert.match(layout, /googletagmanager\.com\/ns\.html/);
  assert.match(layout, /facebook\.com\/tr/);
  assert.match(layout, /consent === "granted"/);
  assert.match(config, /AW-653792266/);
  assert.match(config, /fPK1CKSKsuocEIqo4LcC/);
});

test("the purchase conversion waits for an authoritative active plan", () => {
  const success = read("src/components/billing/billing-success-status.tsx");
  const analytics = read("src/lib/analytics/google-ads.ts");

  assert.match(success, /state\.plan !== "free"/);
  assert.match(success, /state\.status === "active"/);
  assert.match(success, /queueGoogleAdsConversion\(`billing:\$\{sessionId\}`\)/);
  assert.match(analytics, /GOOGLE_ADS_SENT_PREFIX/);
  assert.match(analytics, /window\.gtag\("event", "conversion"/);
});

test("Google Ads is disclosed and permitted by CSP without unsafe inline scripts", () => {
  const proxy = read("src/proxy.ts");
  const cookies = read("src/app/cookies/page.tsx");
  const privacy = read("src/app/privacy/page.tsx");

  assert.match(proxy, /googletagmanager\.com/);
  assert.match(proxy, /img-src[^\n]+https:\/\/www\.googletagmanager\.com/);
  assert.match(proxy, /script-src[^\n]+https:\/\/connect\.facebook\.net/);
  assert.match(proxy, /img-src[^\n]+https:\/\/www\.facebook\.com/);
  assert.match(proxy, /frame-src[^\n]+googletagmanager\.com/);
  assert.doesNotMatch(proxy, /script-src[^\n]+unsafe-inline/);
  assert.match(cookies, /Google Ads y Meta Pixel permanecen desactivados/);
  assert.match(privacy, /Google Tag Manager, Google Ads y Meta Pixel/);
});

test("the consent prompt is compact, optional and explains its privacy boundary", () => {
  const provider = read("src/components/analytics/google-ads-provider.tsx");

  assert.match(provider, /Medición opcional/);
  assert.match(provider, /Solo necesarias/);
  assert.match(provider, /Permitir medición/);
  assert.match(provider, /No\s+compartimos con ellos tus/);
  assert.match(provider, /diseños, prompts ni correo/);
  assert.match(provider, /max-w-md/);
});

test("Meta Pixel loads and records PageView only after marketing consent", () => {
  const provider = read("src/components/analytics/google-ads-provider.tsx");

  assert.match(provider, /consent === "granted"/);
  assert.match(provider, /connect\.facebook\.net\/en_US\/fbevents\.js/);
  assert.match(provider, /window\.fbq\("init", META_PIXEL_ID\)/);
  assert.match(provider, /window\.fbq\("track", "PageView"\)/);
  assert.match(provider, /window\.fbq\("consent", "revoke"\)/);
});
