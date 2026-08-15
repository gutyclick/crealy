import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  GENERATION_PRODUCTS,
  getGenerationVariant,
  getSelectableVariants,
  getSupportedQualities,
  normalizeContentType,
  normalizeGenerationVariant,
} from "../src/config/generation-products";
import {
  GENERATION_STYLES,
  MAX_GENERATION_REFERENCE_IMAGES,
} from "../src/config/generation";
import { isValidFlexibleImageSize } from "../src/config/image-models";
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
import {
  THUMBNAIL_DISTINCTIVENESS_RULES,
  THUMBNAIL_PRESET_CRAFT,
  THUMBNAIL_PRESETS,
  THUMBNAIL_TEXT_MODES,
} from "../src/config/thumbnail-creation";

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

test("thumbnail has one canonical creation format, dimensions and cost", () => {
  const standard = mapGenerationOptions("thumbnail-standard", "standard");
  assert.equal(standard.finalSize, "1280x720");
  assert.equal(standard.quality, "medium");
  assert.equal(standard.creditCost, 1);

  const legacyHigh = mapGenerationOptions("thumbnail-high", "high");
  assert.equal(legacyHigh.finalSize, "1280x720");
  assert.equal(legacyHigh.quality, "medium");
  assert.equal(legacyHigh.creditCost, 1);

  const validated = validateGenerationInput(validInput);
  assert.equal(validated.success, true);
  if (validated.success) {
    assert.equal(validated.data.thumbnailPreset, "impactful");
    assert.equal(validated.data.thumbnailTextMode, "automatic");
  }
});

test("thumbnail creation exposes presets and explicit text modes", () => {
  assert.deepEqual(THUMBNAIL_PRESETS.map((item) => item.id), [
    "impactful", "curiosity", "result", "comparison", "minimal", "cinematic",
  ]);
  assert.deepEqual(THUMBNAIL_TEXT_MODES.map((item) => item.id), ["automatic", "custom", "none"]);
  assert.equal(validateGenerationInput({
    ...validInput,
    thumbnailPreset: "curiosity",
    thumbnailTextMode: "custom",
  }).success, false);
});

test("automatic thumbnail copy is contextual and presets have enforceable craft", () => {
  const orchestrator = readFileSync(
    new URL("../src/lib/generation/thumbnail-orchestrator.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(orchestrator, /:\s*["']Â¿QUÃ‰ PASÃ“\?["']/);
  assert.match(orchestrator, /deriveAutomaticThumbnailText\(input\)/);
  assert.match(orchestrator, /thumbnailCreativeSignature\(input\)/);
  assert.match(orchestrator, /Prohibido devolver ganchos intercambiables/);
  assert.ok(THUMBNAIL_DISTINCTIVENESS_RULES.length >= 5);
  for (const preset of THUMBNAIL_PRESETS) {
    assert.ok(THUMBNAIL_PRESET_CRAFT[preset.id].length >= 4, preset.id);
  }
});

test("legacy thumbnail taxonomy remains readable and normalizes at validation", () => {
  assert.equal(normalizeContentType("youtube-thumbnail"), "thumbnail");
  assert.equal(normalizeGenerationVariant("youtube-16-9"), "thumbnail-standard");
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
    assert.equal(legacy.data.variant, "thumbnail-standard");
    assert.equal(legacy.data.quality, "standard");
  }
});

test("all six creation products and their required defaults are present", () => {
  assert.deepEqual(
    GENERATION_PRODUCTS.map((product) => product.id),
    ["thumbnail", "social-post", "banner", "social-cover", "story", "profile-image"],
  );
  assert.equal(getGenerationVariant("banner-standard")?.recommended, true);
  assert.equal(getGenerationVariant("profile-master")?.creditCost, 2);
  assert.equal(getGenerationVariant("profile-master")?.width, 800);
  assert.equal(getGenerationVariant("profile-master")?.height, 800);
});

test("visible generation formats expose only compatible quality choices", () => {
  for (const product of GENERATION_PRODUCTS) {
    for (const variant of getSelectableVariants(product.id)) {
      const expected = variant.id === "thumbnail-standard"
        ? ["standard"]
        : variant.id === "cover-youtube"
          ? ["high"]
          : ["standard", "high"];
      assert.deepEqual(
        getSupportedQualities(variant),
        expected,
      );
    }
  }
});

test("every product has a GPT Image 2 compatible provider size or fallback", () => {
  for (const product of GENERATION_PRODUCTS) {
    for (const variant of product.variants) {
      assert.equal(
        isValidFlexibleImageSize(variant.requestedProviderSize) ||
          isValidFlexibleImageSize(variant.fallbackProviderSize),
        true,
        `${variant.id} has no compatible provider canvas`,
      );
    }
  }
});

test("flexible GPT Image 2 sizes enforce documented geometry limits", () => {
  assert.equal(isValidFlexibleImageSize("1920x1088"), true);
  assert.equal(isValidFlexibleImageSize("1920x1080"), false);
  assert.equal(isValidFlexibleImageSize("1024x512"), false);
  assert.equal(isValidFlexibleImageSize("2560x1440"), true);
});

test("credit cost is recomputed from product and variant, not client input", () => {
  assert.equal(
    getGenerationCreditCost({
      contentType: "banner",
      variant: "banner-2k",
      quality: "high",
    }),
    5,
  );
  assert.throws(() =>
    getGenerationCreditCost({
      contentType: "social-post",
      variant: "banner-2k",
      quality: "high",
    }),
  );
  assert.equal(
    getGenerationCreditCost({
      contentType: "thumbnail",
      variant: "thumbnail-standard",
      platform: "youtube",
      quality: "standard",
    }),
    1,
  );
  assert.throws(() =>
    getGenerationCreditCost({
      contentType: "social-cover",
      variant: "cover-youtube",
      platform: "youtube",
      quality: "standard",
    }),
  );
});

test("credit costs follow the public creation matrix", () => {
  assert.equal(getGenerationCreditCost({
    contentType: "thumbnail",
    variant: "thumbnail-standard",
    platform: "youtube",
    quality: "standard",
  }), 1);
  assert.equal(getGenerationCreditCost({
    contentType: "social-post",
    variant: "post-square",
    quality: "standard",
  }), 1);
  assert.equal(getGenerationCreditCost({
    contentType: "social-post",
    variant: "post-square",
    quality: "high",
  }), 2);
  assert.equal(getGenerationCreditCost({
    contentType: "social-post",
    variant: "post-square",
    quality: "standard",
    creationMode: "recreate",
  }), 2);
  assert.equal(getGenerationCreditCost({
    contentType: "social-post",
    variant: "post-square",
    quality: "high",
    creationMode: "recreate",
  }), 3);
  assert.equal(getGenerationCreditCost({
    contentType: "social-cover",
    variant: "cover-youtube",
    platform: "youtube",
    quality: "high",
  }), 5);
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

test("generation accepts at most four distinct reference images", () => {
  const references = [
    "8c9f0c30-7932-4ec1-9eb1-369f4fac0321",
    "4ed245f2-01dc-4294-a482-71b78e3cd08d",
    "a1f5b3e0-a60d-4889-8b95-119f618422ea",
    "07e86096-9c80-4d62-a2aa-35cf0265c5cd",
  ];
  assert.equal(MAX_GENERATION_REFERENCE_IMAGES, 4);
  assert.equal(
    validateGenerationInput({
      ...validInput,
      referenceUploadIds: references,
    }).success,
    true,
  );
  const tooMany = validateGenerationInput({
    ...validInput,
    referenceUploadIds: [
      ...references,
      "ab86a394-ebf1-4413-a47f-4dff1ad7d437",
    ],
  });
  assert.equal(tooMany.success, false);
  if (!tooMany.success) assert.ok(tooMany.fields.referenceUploadIds);
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
