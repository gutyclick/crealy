import assert from "node:assert/strict";
import test from "node:test";

import { getBrandStyleEntitlement } from "../src/config/brand-styles";
import { buildBrandStylePrompt } from "../src/lib/brand-styles/build-style-prompt";
import { ownsBrandStyle } from "../src/lib/brand-styles/policy";

test("brand style limits are centralized by effective plan", () => {
  assert.equal(getBrandStyleEntitlement("free").enabled, false);
  assert.deepEqual([getBrandStyleEntitlement("pro").maxStyles, getBrandStyleEntitlement("pro").maxReferences], [1, 6]);
  assert.deepEqual([getBrandStyleEntitlement("business").maxStyles, getBrandStyleEntitlement("business").maxReferences], [5, 10]);
  assert.equal(getBrandStyleEntitlement("business").canDuplicate, true);
});

test("brand style ownership rejects foreign user ids", () => {
  assert.equal(ownsBrandStyle("user-a", { user_id: "user-a" }), true);
  assert.equal(ownsBrandStyle("user-a", { user_id: "user-b" }), false);
});

test("generation prompt prioritizes intent and forbids copying reference content", () => {
  const prompt = buildBrandStylePrompt({
    userPrompt: "Una miniatura sobre inversión responsable",
    designType: "thumbnail",
    consistency: "strict",
    preset: "gamer",
    brandStyle: {
      name: "Canal principal",
      visualSummary: "Fondos oscuros, texto blanco grande y acentos rojos.",
      visualAttributes: { colors: ["negro", "rojo"], composition: ["sujeto a la derecha"], typography: ["mayúsculas"], lighting: ["contraluz"], subjects: ["recortes limpios"], effects: ["contorno"], mood: ["directo"] },
    },
  });
  assert.ok(prompt.indexOf("prioridad absoluta") < prompt.indexOf("Preset secundario"));
  assert.match(prompt, /no al contenido/i);
  assert.match(prompt, /No reutilices textos, personas, objetos, escenas ni títulos/i);
  assert.match(prompt, /composición original/i);
});
