import assert from "node:assert/strict";
import test from "node:test";

import { mapGenerationOptions } from "../src/lib/generation/map-generation-options";
import { validateGenerationInput } from "../src/lib/generation/validate-generation-input";
import {
  GENERATION_CONTENT_TYPES,
  GENERATION_STYLES,
} from "../src/config/generation";
import { PLATFORM_COVERS } from "../src/config/content-formats";
import { normalizeHexColor } from "../src/lib/colors/normalize-hex-color";
import { validateColorPalette } from "../src/lib/colors/validate-color-palette";
import {
  resolveFallbackImageSize,
  resolveImageSize,
} from "../src/lib/generation/resolve-image-size";
import { resolveAutomaticStyle } from "../src/config/visual-styles";

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

test("YouTube delivers a 1920x1080 thumbnail and forces high quality", () => {
  const output = mapGenerationOptions("youtube-16-9", "fast");
  assert.equal(output.size, "1920x1088");
  assert.equal(output.finalSize, "1920x1080");
  assert.equal(output.quality, "high");

  const validated = validateGenerationInput(validInput);
  assert.equal(validated.success, true);
  if (validated.success) assert.equal(validated.data.quality, "high");
});

test("platform covers expose exact final dimensions without incompatible provider sizes", () => {
  const facebook = mapGenerationOptions("facebook-cover", "fast");
  assert.equal(facebook.size, "1702x630");
  assert.equal(facebook.finalSize, "1702x630");
  assert.equal(facebook.quality, "high");

  const x = mapGenerationOptions("x-cover", "fast");
  assert.equal(x.size, "1500x500");
  assert.equal(x.finalSize, "1500x500");
  assert.equal(x.quality, "high");

  const linkedin = mapGenerationOptions("linkedin-cover", "fast");
  assert.equal(linkedin.size, "1584x396");
  assert.equal(linkedin.finalSize, "1584x396");
  assert.ok(linkedin.safeArea.width > 0);
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

test("creation taxonomy exposes sizes after category and the requested style set", () => {
  const covers = GENERATION_CONTENT_TYPES.find(
    (item) => item.id === "social-cover",
  );
  assert.deepEqual(covers?.formats, [
    "youtube-cover",
    "facebook-cover",
    "x-cover",
    "linkedin-cover",
  ]);
  assert.deepEqual(
    GENERATION_STYLES.map((style) => style.label),
    [
      "Automático",
      "Viral",
      "Gamer",
      "Deportivo",
      "Minimalista",
      "Profesional",
      "Podcast",
      "Cinematográfico",
      "Corporativo",
      "Educativo",
      "Tecnología",
      "Lujo",
      "Noticias",
    ],
  );
});

test("YouTube channel cover requests native 2560x1440 and centers its safe area", () => {
  const resolved = resolveImageSize({
    model: "gpt-image-2",
    contentType: "social-cover",
    coverPlatform: "youtube",
    format: "youtube-cover",
  });
  assert.deepEqual(resolved, {
    requestedSize: "2560x1440",
    providerSize: "2560x1440",
    exportWidth: 2560,
    exportHeight: 1440,
    requiresPostProcessing: false,
    fallbackReason: null,
  });
  const safe = PLATFORM_COVERS.youtube.safeArea;
  assert.equal(safe.width, 1235);
  assert.equal(safe.height, 338);
  assert.ok(Math.abs(safe.x * 2 + safe.width - 2560) <= 1);
  assert.equal(safe.y * 2 + safe.height, 1440);
});

test("cover validation requires a matching platform and high quality", () => {
  const cover = {
    ...validInput,
    contentType: "social-cover",
    coverPlatform: "youtube",
    format: "youtube-cover",
    quality: "high",
  };
  assert.equal(validateGenerationInput(cover).success, true);
  const incompatible = validateGenerationInput({ ...cover, format: "x-cover" });
  assert.equal(incompatible.success, false);
  const low = validateGenerationInput({ ...cover, quality: "fast" });
  assert.equal(low.success, false);
});

test("size fallback is explicit and never changes export dimensions", () => {
  const fallback = resolveFallbackImageSize(
    {
      model: "gpt-image-2",
      contentType: "social-cover",
      coverPlatform: "x",
      format: "x-cover",
    },
    "provider_rejected_requested_size",
  );
  assert.equal(fallback.providerSize, "1536x512");
  assert.equal(fallback.exportWidth, 1500);
  assert.equal(fallback.exportHeight, 500);
  assert.equal(fallback.requiresPostProcessing, true);
  assert.equal(fallback.fallbackReason, "provider_rejected_requested_size");
});

test("hex palettes normalize short values and reject arbitrary CSS", () => {
  assert.equal(normalizeHexColor("#dF2"), "#DDFF22");
  assert.equal(normalizeHexColor("rgb(1,2,3)"), null);
  assert.deepEqual(validateColorPalette(["#fff", "#DDF527"]), {
    success: true,
    colors: ["#FFFFFF", "#DDF527"],
  });
  assert.equal(validateColorPalette(["red"]).success, false);
  assert.equal(
    validateColorPalette(["#000", "#111", "#222", "#333", "#444", "#555"]).success,
    false,
  );
});

test("automatic style selection is deterministic and does not call a provider", () => {
  const input = {
    contentType: "youtube-thumbnail" as const,
    description: "Tutorial de tecnología sobre inteligencia artificial",
  };
  assert.equal(resolveAutomaticStyle(input), "educational");
  assert.equal(resolveAutomaticStyle(input), "educational");
});
