import assert from "node:assert/strict";
import test from "node:test";

import {
  GENERATION_PRODUCTS,
  getGenerationVariant,
  normalizeContentType,
  normalizeGenerationVariant,
} from "../src/config/generation-products";
import { GENERATION_STYLES } from "../src/config/generation";
import { PLATFORM_COVERS } from "../src/config/content-formats";
import { resolveAutomaticStyle } from "../src/config/visual-styles";
import { normalizeHexColor } from "../src/lib/colors/normalize-hex-color";
import { validateColorPalette } from "../src/lib/colors/validate-color-palette";
import { getGenerationCreditCost } from "../src/lib/credits/get-generation-credit-cost";
import { mapGenerationOptions } from "../src/lib/generation/map-generation-options";
import {
  resolveFallbackImageSize,
  resolveImageSize,
} from "../src/lib/generation/resolve-image-size";
import { validateGenerationInput } from "../src/lib/generation/validate-generation-input";

const validInput = {
  clientRequestId: "3f1ac702-4a56-4c80-9f7c-ae48ce8b1193",
  contentType: "thumbnail",
  platform: "youtube",
  description: "Una miniatura clara para un video de productividad.",
  style: "minimal",
  colorPreference: "custom",
  customColors: ["#DDF527", "#10110D", "#FFFFFF", "#334455", "#AABBCC"],
  variant: "thumbnail-standard",
  format: "thumbnail-standard",
  quality: "standard",
};

test("thumbnail quality maps to its canonical variant, dimensions and cost", () => {
  const standard = mapGenerationOptions("thumbnail-standard", "standard");
  assert.equal(standard.finalSize, "1280x720");
  assert.equal(standard.quality, "medium");
  assert.equal(standard.creditCost, 1);

  const high = mapGenerationOptions("thumbnail-high", "high");
  assert.equal(high.finalSize, "1920x1080");
  assert.equal(high.quality, "high");
  assert.equal(high.creditCost, 2);

  const validated = validateGenerationInput(validInput);
  assert.equal(validated.success, true);
});

test("legacy thumbnail taxonomy remains readable and normalizes at validation", () => {
  assert.equal(normalizeContentType("youtube-thumbnail"), "thumbnail");
  assert.equal(normalizeGenerationVariant("youtube-16-9"), "thumbnail-high");
  const legacy = validateGenerationInput({
    ...validInput,
    contentType: "youtube-thumbnail",
    variant: undefined,
    format: "youtube-16-9",
    quality: "fast",
  });
  assert.equal(legacy.success, true);
  if (legacy.success) {
    assert.equal(legacy.data.contentType, "thumbnail");
    assert.equal(legacy.data.variant, "thumbnail-high");
    assert.equal(legacy.data.quality, "high");
  }
});

test("all six creation products and their required defaults are present", () => {
  assert.deepEqual(
    GENERATION_PRODUCTS.map((product) => product.id),
    ["thumbnail", "social-post", "banner", "social-cover", "story", "profile-image"],
  );
  assert.equal(getGenerationVariant("banner-standard")?.recommended, true);
  assert.equal(getGenerationVariant("profile-master")?.creditCost, 2);
});

test("credit cost is recomputed from product and variant, not client input", () => {
  assert.equal(
    getGenerationCreditCost({
      contentType: "banner",
      variant: "banner-2k",
      quality: "high",
    }),
    4,
  );
  assert.throws(() =>
    getGenerationCreditCost({
      contentType: "social-post",
      variant: "banner-2k",
      quality: "high",
    }),
  );
  assert.throws(() =>
    getGenerationCreditCost({
      contentType: "thumbnail",
      variant: "thumbnail-high",
      platform: "youtube",
      quality: "standard",
    }),
  );
});

test("custom palettes accept up to five unique hexadecimal colors", () => {
  assert.equal(validateGenerationInput(validInput).success, true);
  const tooMany = validateGenerationInput({
    ...validInput,
    customColors: [...validInput.customColors, "#000000"],
  });
  assert.equal(tooMany.success, false);
  if (!tooMany.success) assert.ok(tooMany.fields.customColors);
});

test("covers use fixed platform variants and reject mismatches", () => {
  const cover = {
    ...validInput,
    contentType: "social-cover",
    platform: "youtube",
    variant: "cover-youtube",
    format: "cover-youtube",
    quality: "high",
  };
  assert.equal(validateGenerationInput(cover).success, true);
  assert.equal(
    validateGenerationInput({ ...cover, variant: "cover-x", format: "cover-x" }).success,
    false,
  );
  assert.equal(PLATFORM_COVERS.youtube.exportWidth, 2560);
  assert.equal(PLATFORM_COVERS.youtube.exportHeight, 1440);
});

test("YouTube cover requests native 2560x1440 with an explicit fallback", () => {
  const resolved = resolveImageSize({
    model: "gpt-image-2",
    contentType: "social-cover",
    platform: "youtube",
    variant: "cover-youtube",
  });
  assert.equal(resolved.providerSize, "2560x1440");
  assert.equal(resolved.requiresPostProcessing, false);
  const fallback = resolveFallbackImageSize(
    {
      model: "gpt-image-2",
      contentType: "social-cover",
      platform: "youtube",
      variant: "cover-youtube",
    },
    "provider_rejected_requested_size",
  );
  assert.equal(fallback.providerSize, "1536x1024");
  assert.equal(fallback.exportWidth, 2560);
  assert.equal(fallback.exportHeight, 1440);
  assert.equal(fallback.fallbackReason, "provider_rejected_requested_size");
});

test("stories validate platform, quality variant and safe-area preference", () => {
  const story = validateGenerationInput({
    ...validInput,
    contentType: "story",
    platform: "instagram",
    variant: "story-high",
    format: "story-high",
    quality: "high",
    showSafeArea: true,
  });
  assert.equal(story.success, true);
  const invalidPlatform = validateGenerationInput({
    ...validInput,
    contentType: "story",
    platform: "x",
    variant: "story-standard",
    format: "story-standard",
    quality: "standard",
  });
  assert.equal(invalidPlatform.success, false);
});

test("profile images require mode, intensity and background", () => {
  const profile = {
    ...validInput,
    contentType: "profile-image",
    platform: "linkedin",
    variant: "profile-master",
    format: "profile-master",
    quality: "high",
    style: "professional",
    profileMode: "professional",
    profileIntensity: "balanced",
    profileBackground: "neutral",
  };
  assert.equal(validateGenerationInput(profile).success, true);
  const missingMode = { ...profile, profileMode: undefined };
  assert.equal(validateGenerationInput(missingMode).success, false);
});

test("style registry includes the established set and story-specific directions", () => {
  const labels = new Set<string>(GENERATION_STYLES.map((style) => style.label));
  for (const label of [
    "Automático", "Viral", "Gamer", "Deportivo", "Minimalista",
    "Profesional", "Podcast", "Cinematográfico", "Corporativo",
    "Educativo", "Tecnología", "Lujo", "Noticias",
    "Promocional", "Moda", "Gastronomía", "Evento",
  ]) {
    assert.ok(labels.has(label));
  }
});

test("hex palettes normalize safely and automatic style is deterministic", () => {
  assert.equal(normalizeHexColor("#dF2"), "#DDFF22");
  assert.equal(normalizeHexColor("rgb(1,2,3)"), null);
  assert.deepEqual(validateColorPalette(["#fff", "#DDF527"]), {
    success: true,
    colors: ["#FFFFFF", "#DDF527"],
  });
  const input = {
    contentType: "thumbnail" as const,
    description: "Tutorial de tecnología sobre inteligencia artificial",
  };
  assert.equal(resolveAutomaticStyle(input), "educational");
  assert.equal(resolveAutomaticStyle(input), "educational");
});
