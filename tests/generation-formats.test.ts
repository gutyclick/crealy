import assert from "node:assert/strict";
import test from "node:test";

import { mapGenerationOptions } from "../src/lib/generation/map-generation-options";
import { validateGenerationInput } from "../src/lib/generation/validate-generation-input";

const validInput = {
  clientRequestId: "3f1ac702-4a56-4c80-9f7c-ae48ce8b1193",
  contentType: "youtube-thumbnail",
  description: "Una portada clara para un video de productividad.",
  style: "minimal",
  colorPreference: "custom",
  customColors: ["#DDF527", "#10110D", "#FFFFFF", "#334455", "#AABBCC"],
  format: "youtube-16-9",
  quality: "fast",
};

test("YouTube requests GPT Image 2 directly at 2560x1440 and forces high quality", () => {
  const output = mapGenerationOptions("youtube-16-9", "fast");
  assert.equal(output.size, "2560x1440");
  assert.equal(output.finalSize, "2560x1440");
  assert.equal(output.quality, "high");

  const validated = validateGenerationInput(validInput);
  assert.equal(validated.success, true);
  if (validated.success) assert.equal(validated.data.quality, "high");
});

test("platform covers expose exact final dimensions without incompatible provider sizes", () => {
  const x = mapGenerationOptions("x-cover", "fast");
  assert.equal(x.size, "1536x512");
  assert.equal(x.finalSize, "1500x500");
  assert.equal(x.quality, "high");

  const linkedin = mapGenerationOptions("linkedin-cover", "fast");
  assert.equal(linkedin.size, "1536x512");
  assert.equal(linkedin.finalSize, "1584x396");
  assert.match(linkedin.safeArea, /central/i);
});

test("custom palettes accept up to five unique hexadecimal colors", () => {
  const validated = validateGenerationInput(validInput);
  assert.equal(validated.success, true);

  const tooMany = validateGenerationInput({
    ...validInput,
    customColors: [...validInput.customColors, "#000000"],
  });
  assert.equal(tooMany.success, false);
  if (!tooMany.success) assert.ok(tooMany.fields.customColors);
});
