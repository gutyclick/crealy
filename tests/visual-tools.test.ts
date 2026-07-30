import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { tools } from "../src/config/tools";
import { isThumbnailAnalysis } from "../src/lib/tools/validate-thumbnail-analysis";

const validAnalysis = {
  overallScore: 78,
  summary: "La idea principal se entiende.",
  categories: {
    composition: { score: 80, feedback: "Buen balance." },
    textLegibility: { score: 75, feedback: "Texto visible." },
    visualHierarchy: { score: 82, feedback: "Foco claro." },
    contrast: { score: 76, feedback: "Contraste suficiente." },
    smallSizeClarity: { score: 70, feedback: "Simplificable." },
    focus: { score: 84, feedback: "Sujeto dominante." },
  },
  strengths: ["Foco claro"],
  improvements: ["Reducir texto"],
  suggestedActions: ["Probar una versión más simple"],
};

test("tool registry has unique ids and public routes", () => {
  assert.equal(new Set(tools.map((tool) => tool.id)).size, tools.length);
  for (const tool of tools) {
    assert.match(tool.href, /^\/tools\/[a-z0-9-]+$/);
  }
});

test("AI tools declare authentication explicitly", () => {
  assert.equal(
    tools.filter((tool) => tool.usesAI).every((tool) => tool.requiresAuth),
    true,
  );
});

test("accepts a complete thumbnail analysis and rejects invalid scores", () => {
  assert.equal(isThumbnailAnalysis(validAnalysis), true);
  assert.equal(
    isThumbnailAnalysis({ ...validAnalysis, overallScore: 140 }),
    false,
  );
  assert.equal(
    isThumbnailAnalysis({
      ...validAnalysis,
      categories: { ...validAnalysis.categories, focus: undefined },
    }),
    false,
  );
});

test("paid analysis reserves credits before calling OpenAI and releases failures", () => {
  const route = readFileSync(
    "src/app/api/tools/thumbnail-analyzer/route.ts",
    "utf8",
  );
  assert.ok(route.indexOf("reserveCredits({") < route.indexOf("analyzeThumbnail({"));
  assert.match(route, /releaseCredits\(user\.id, reservationId\)/);
  assert.match(route, /client_request_id/);
});

test("credit schema recognizes thumbnail analysis as its own reference", () => {
  const migration = readFileSync(
    "supabase/migrations/20260729110000_reserve_visual_tool_credits.sql",
    "utf8",
  );
  assert.match(migration, /'generation', 'edit', 'thumbnail_analysis'/);
  assert.match(migration, /idempotency_key/);
});
