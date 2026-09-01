import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  parseGenerationFeedbackInput,
  pickAutomaticEvaluation,
} from "../src/lib/generation/generation-feedback";

test("generation feedback accepts structured reasons but never requests a correction", () => {
  assert.deepEqual(
    parseGenerationFeedbackInput({
      verdict: "not_useful",
      reasons: ["identity", "text", "identity"],
      comment: "La jerarquía no coincide con mi intención.",
      correctionRequested: true,
      correctionRequest: "Conserva mi rostro y cambia únicamente el titular.",
    }),
    {
      verdict: "not_useful",
      reasons: ["identity", "text"],
      comment: "La jerarquía no coincide con mi intención.",
      correctionRequested: false,
      correctionRequest: null,
    },
  );
});

test("generation feedback rejects unknown reasons and ignores regeneration fields", () => {
  assert.equal(
    parseGenerationFeedbackInput({
      verdict: "useful",
      reasons: ["ctr"],
      correctionRequested: false,
    }),
    null,
  );
  assert.deepEqual(
    parseGenerationFeedbackInput({
      verdict: "useful",
      reasons: [],
      correctionRequested: true,
      correctionRequest: "Cambia el texto por favor.",
    }),
    {
      verdict: "useful",
      reasons: [],
      comment: null,
      correctionRequested: false,
      correctionRequest: null,
    },
  );
  assert.deepEqual(
    parseGenerationFeedbackInput({
      verdict: "not_useful",
      reasons: ["quality"],
      correctionRequested: true,
      correctionRequest: "Muy corto",
    }),
    {
      verdict: "not_useful",
      reasons: ["quality"],
      comment: null,
      correctionRequested: false,
      correctionRequest: null,
    },
  );
});

test("the feedback interface cannot enqueue another generation", () => {
  const component = readFileSync(
    new URL("../src/components/generation/generation-feedback.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(component, /\/correction|Crear corrección|versión corregida/);
  assert.match(component, /Guardar opinión/);
});

test("automatic evaluation snapshots exclude unrelated generation metadata", () => {
  assert.deepEqual(
    pickAutomaticEvaluation({
      evaluationScore: 87,
      criticalErrors: [],
      recreateIdentityScore: 92,
      privateInternalNote: "do-not-copy",
      thumbnailPreset: "impactful",
    }),
    {
      evaluationScore: 87,
      criticalErrors: [],
      recreateIdentityScore: 92,
    },
  );
});

test("generation feedback migration keeps analytics authoritative and private", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260815020000_add_generation_feedback.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /configuration_snapshot jsonb not null/);
  assert.match(migration, /automatic_evaluation_snapshot jsonb not null/);
  assert.match(migration, /enable row level security/);
  assert.match(
    migration,
    /revoke all on table public\.generation_feedback from public, anon, authenticated/,
  );
  assert.doesNotMatch(migration, /grant insert .* authenticated/);
});

test("detailed generation feedback is persisted and queued for support email", () => {
  const route = readFileSync(
    new URL("../src/app/api/generations/[id]/feedback/route.ts", import.meta.url),
    "utf8",
  );
  const worker = readFileSync(
    new URL("../src/lib/jobs/worker.ts", import.meta.url),
    "utf8",
  );
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260901010000_add_generation_feedback_email.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(route, /type: "generation_feedback_internal"/);
  assert.match(route, /data: \{ feedbackId: saved\.id \}/);
  assert.match(worker, /generation_feedback_unavailable/);
  assert.match(worker, /from\("generation_feedback"\)/);
  assert.match(migration, /'generation_feedback_internal'/);
});
