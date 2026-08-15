import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildRecreatePrompt } from "../src/lib/recreate/build-recreate-prompt";
import {
  buildCorrectiveRecreatePrompt,
  shouldCorrectRecreate,
} from "../src/lib/recreate/evaluation-policy";
import { getYouTubeThumbnailUrl, parseYouTubeVideoId } from "../src/lib/recreate/reference";
import type { GenerationInput } from "../src/types/generation";
import type { RecreateEvaluation } from "../src/types/recreate";

test("extracts supported YouTube video URLs", () => {
  assert.equal(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=2"), "dQw4w9WgXcQ");
  assert.equal(parseYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(getYouTubeThumbnailUrl("dQw4w9WgXcQ"), "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
});

test("builds an original-by-design Recreate prompt", () => {
  const input = {
    creationMode: "recreate",
    recreateSimilarity: "very_similar",
    recreateFocus: "text",
    recreateGoal: "performance",
    contentType: "thumbnail",
    variant: "thumbnail-standard",
    description: "Un video sobre mis primeros mil suscriptores",
    primaryText: "POR FIN",
    referenceUploadIds: ["reference", "subject-1", "subject-2", "product"],
    recreateReferenceRoles: ["protagonist", "supporting", "product"],
    recreatePreservation: {
      composition: true,
      pose: true,
      lighting: false,
      colors: true,
      typography: false,
    },
    recreateBlueprint: {
      category: "thumbnail",
      composition: "Sujeto a la derecha y texto a la izquierda",
      hierarchy: "Rostro, texto, objeto secundario",
      visualStyle: "Enérgico y nítido",
      background: "Fondo simple con separación",
      emotion: "Sorpresa",
      textDensity: "Baja",
      subjectScale: "Grande",
      colorPalette: ["amarillo", "negro"],
      focalElements: ["rostro", "titular"],
      replaceableElements: ["persona", "texto", "logo"],
    },
  } as GenerationInput;
  const prompt = buildRecreatePrompt(input) ?? "";
  assert.match(prompt, /obra inequívocamente original/);
  assert.match(prompt, /nunca copies texto, nombres, logos/);
  assert.match(prompt, /imágenes 2 a 4 son 3 sujetos, productos u objetos/);
  assert.match(prompt, /Imagen 2: protagonista principal/);
  assert.match(prompt, /Imagen 4: producto u objeto principal/);
  assert.match(prompt, /conserva el gesto, la dirección corporal/);
  assert.match(prompt, /conserva las familias cromáticas/);
  assert.match(prompt, /Representa cada sujeto u objeto una sola vez/);
  assert.match(prompt, /no mezcles rostros/);
  assert.match(prompt, /CONSERVACIÓN SOLICITADA/);
  assert.match(prompt, /Mejora buscada:.*detener el scroll/);
});

test("Recreate correction is limited to critical identity, subject and text failures", () => {
  const evaluation: RecreateEvaluation = {
    approved: false,
    score: 61,
    identityScore: 52,
    compositionScore: 81,
    textScore: 35,
    criticalErrors: ["identity_drift", "incorrect_text"],
    problems: ["El rostro cambió", "El titular no coincide"],
    corrections: ["Conservar las facciones", "Usar el texto exacto"],
  };
  assert.equal(shouldCorrectRecreate(evaluation), true);
  const prompt = buildCorrectiveRecreatePrompt("PROMPT ORIGINAL", evaluation);
  assert.match(prompt, /PROMPT ORIGINAL/);
  assert.match(prompt, /El rostro cambió/);
  assert.match(prompt, /Cada material propio debe aparecer exactamente una vez/);
  assert.equal(
    shouldCorrectRecreate({
      ...evaluation,
      criticalErrors: ["composition_mismatch"],
    }),
    false,
  );
});

test("Recreate exposes four total reference slots", () => {
  const source = readFileSync(
    "src/components/recreate/recreate-panel.tsx",
    "utf8",
  );
  assert.match(source, /MAX_GENERATION_REFERENCE_IMAGES/);
  assert.match(source, /Añade hasta 3 imágenes propias/);
  assert.match(source, /multiple/);
  assert.match(source, /RECREATE_REFERENCE_ROLES/);
  assert.match(source, /RecreateBlueprintEditor/);
  assert.match(source, /RECREATE_PRESERVATION_OPTIONS/);
});

test("Recreate becomes usable before deep analysis finishes", () => {
  const source = readFileSync(
    "src/components/recreate/recreate-panel.tsx",
    "utf8",
  );
  const readyIndex = source.indexOf("blueprint: fallback, ready: true");
  const analysisIndex = source.indexOf('fetch("/api/recreate/analyze"');
  assert.ok(readyIndex > 0);
  assert.ok(analysisIndex > readyIndex);
});

test("Recreate persists its controls and evaluates critical output defects in the worker", () => {
  const route = readFileSync("src/app/api/generations/route.ts", "utf8");
  const worker = readFileSync("src/lib/jobs/worker.ts", "utf8");
  assert.match(route, /recreateReferenceRoles: input\.recreateReferenceRoles/);
  assert.match(route, /recreatePreservation: input\.recreatePreservation/);
  assert.match(worker, /evaluateRecreate\(/);
  assert.match(worker, /shouldCorrectRecreate\(firstEvaluation\)/);
  assert.match(worker, /recreateEvaluationScore/);
  assert.match(worker, /wasRecreateAutomaticallyRegenerated/);
});
