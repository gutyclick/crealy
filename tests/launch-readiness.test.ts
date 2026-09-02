import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getLaunchStage } from "../src/config/launch";
import { renderEmailTemplate } from "../src/lib/email/templates";
import { getPublicSiteUrl } from "../src/lib/seo/get-public-site-url";

test("production defaults to the public production stage", () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousStage = process.env.NEXT_PUBLIC_LAUNCH_STAGE;
  mutableEnv.NODE_ENV = "production";
  delete process.env.NEXT_PUBLIC_LAUNCH_STAGE;
  assert.equal(getLaunchStage(), "production");
  mutableEnv.NODE_ENV = previousNodeEnv;
  if (previousStage === undefined) delete process.env.NEXT_PUBLIC_LAUNCH_STAGE;
  else process.env.NEXT_PUBLIC_LAUNCH_STAGE = previousStage;
});

test("public SEO URL rejects malformed configuration", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "www.crealy.app";
  assert.equal(getPublicSiteUrl(), "https://www.crealy.app");
  process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com/path";
  assert.equal(getPublicSiteUrl(), "https://preview.example.com");
  if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = previous;
});

test("transactional templates escape user-controlled text", () => {
  const email = renderEmailTemplate("support_internal", {
    siteUrl: "https://www.crealy.app",
    category: "technical",
    subject: "<script>alert(1)</script>",
    reference: "CR-1234",
  });
  assert.doesNotMatch(email.html, /<script>alert/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.ok(email.text.length > 20);
});

test("the credit grant is a transactional, actionable email", () => {
  const email = renderEmailTemplate("credit_gift", {
    credits: 5,
    reason: "Cortesía por incidencia",
    siteUrl: "https://www.crealy.app",
  });

  assert.equal(email.subject, "¡Has recibido créditos!");
  assert.match(email.html, /Cortesía por incidencia/);
  assert.match(email.html, /https:\/\/www\.crealy\.app\/create/);
  assert.match(email.html, /color-scheme:only dark/);
  assert.match(email.html, /class="email-canvas" bgcolor="#080808"/);
});

test("email delivery, job and outbox are created atomically", () => {
  const migration = readFileSync(
    "supabase/migrations/20260729130000_harden_launch_communications.sql",
    "utf8",
  );
  assert.match(migration, /enqueue_transactional_email_internal/);
  assert.match(migration, /insert into public\.email_deliveries/);
  assert.match(migration, /insert into public\.jobs/);
  assert.match(migration, /insert into public\.job_outbox/);
});
