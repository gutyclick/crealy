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
import { deriveAutomaticThumbnailText } from "../src/lib/generation/derive-thumbnail-text";
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
  textMode: "automatic",
  peopleMode: "none",
  peopleCount: 0,
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
    assert.equal(validated.data.textMode, "automatic");
    assert.equal(validated.data.thumbnailTextMode, "automatic");
  }
});

test("text choice is explicit for every text-capable format", () => {
  const missingChoice = validateGenerationInput({
    ...validInput,
    textMode: undefined,
  });
  assert.equal(missingChoice.success, false);
  if (!missingChoice.success) {
    assert.equal(missingChoice.fields.textMode, "Indica si quieres texto visible en el diseño.");
  }

  const withoutVisibleText = validateGenerationInput({
    ...validInput,
    textMode: "none",
    primaryText: "NO DEBE APARECER",
  });
  assert.equal(withoutVisibleText.success, true);
  if (withoutVisibleText.success) {
    assert.equal(withoutVisibleText.data.textMode, "none");
    assert.equal(withoutVisibleText.data.primaryText, undefined);
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
    textMode: "custom",
    thumbnailTextMode: "custom",
  }).success, false);
});

test("creation supports zero to four generated or uploaded people", () => {
  const generated = validateGenerationInput({
    ...validInput,
    peopleMode: "generated",
    peopleCount: 4,
  });
  assert.equal(generated.success, true);

  const uploadIds = [
    "eaf1a9f6-e37d-4fe4-b17e-000000000001",
    "eaf1a9f6-e37d-4fe4-b17e-000000000002",
  ];
  const uploaded = validateGenerationInput({
    ...validInput,
    peopleMode: "uploaded",
    peopleCount: 2,
    referenceUploadIds: uploadIds,
  });
  assert.equal(uploaded.success, true);

  const missingPerson = validateGenerationInput({
    ...validInput,
    peopleMode: "uploaded",
    peopleCount: 2,
    referenceUploadIds: uploadIds.slice(0, 1),
  });
  assert.equal(missingPerson.success, false);
  if (!missingPerson.success) assert.match(missingPerson.fields.referenceUploadIds, /exactamente 2 fotos/i);

  const tooMany = validateGenerationInput({
    ...validInput,
    peopleMode: "generated",
    peopleCount: 5,
  });
  assert.equal(tooMany.success, false);
  if (!tooMany.success) assert.match(tooMany.fields.peopleCount, /una y cuatro/i);
});

test("automatic thumbnail copy is contextual and presets have enforceable craft", () => {
  const orchestrator = readFileSync(
    new URL("../src/lib/generation/thumbnail-orchestrator.ts", import.meta.url),
    "utf8",
  );
  const copyFallback = readFileSync(
    new URL("../src/lib/generation/derive-thumbnail-text.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(orchestrator, /:\s*["']¿QUÉ PASÓ\?["']/);
  assert.match(orchestrator, /deriveAutomaticThumbnailText\(input\)/);
  assert.match(orchestrator, /thumbnailCreativeSignature\(input\)/);
  assert.match(orchestrator, /Prohibido devolver ganchos intercambiables/);
  assert.match(orchestrator, /textPrimaryColor/);
  assert.match(orchestrator, /identity_drift/);
  assert.equal(
    deriveAutomaticThumbnailText({
      videoTitle: "Probé Todas las Máquinas Expendedoras de Japón",
      description: "Un recorrido por máquinas de Japón.",
    }),
    "MÁQUINAS EXPENDEDORAS DE JAPÓN",
  );
  assert.equal(
    deriveAutomaticThumbnailText({
      videoTitle: "Pasé 72 horas en una isla llena de serpientes VENENOSAS",
      description: "Un reto de supervivencia rodeado de animales peligrosos.",
    }),
    "SERPIENTES VENENOSAS",
  );
  assert.match(orchestrator, /núcleo de impacto/i);
  assert.match(orchestrator, /RAZONA LA EMOCIÓN/i);
  assert.match(orchestrator, /análisis semántico abierto/i);
  assert.match(orchestrator, /prueba contrafactual/i);
  assert.match(orchestrator, /desenfoque localizado/i);
  assert.match(orchestrator, /revealJustification/);
  assert.match(orchestrator, /evento → anomalía → consecuencia/i);
  assert.match(orchestrator, /viewerQuestion/);
  assert.doesNotMatch(orchestrator, /72 horas comiendo comida rápida/i);
  assert.doesNotMatch(copyFallback, /HIGH_IMPACT_PATTERNS/);
  assert.doesNotMatch(copyFallback, /serpientes?|tiburones?|hamburguesas?/i);
  assert.equal(
    deriveAutomaticThumbnailText({
      videoTitle: "Dormí en el hotel más PEQUEÑO del mundo",
      description: "Una experiencia inesperada en un espacio mínimo.",
    }),
    "MÁS PEQUEÑO",
  );
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

test("Recreate validates one role per supporting reference and preservation controls", () => {
  const referenceUploadIds = [
    "8c9f0c30-7932-4ec1-9eb1-369f4fac0321",
    "4ed245f2-01dc-4294-a482-71b78e3cd08d",
  ];
  const recreate = {
    ...validInput,
    creationMode: "recreate",
    referenceUploadIds,
    recreateReferenceRoles: ["protagonist"],
    recreateElementAnalyses: [
      {
        kind: "person",
        recommendedRole: "protagonist",
        faceCount: 1,
        primarySubject: "Una persona de frente",
        identityAnchors: ["rostro visible", "camiseta negra"],
        placementGuidance: "Usar como protagonista sin alterar sus rasgos.",
        warnings: [],
      },
    ],
    recreatePreservation: {
      composition: true,
      pose: false,
      lighting: true,
      colors: false,
      typography: true,
    },
    recreateBlueprint: {
      category: "thumbnail",
      composition: "Sujeto a la derecha y titular a la izquierda.",
      hierarchy: "Sujeto, titular y fondo.",
      visualStyle: "Editorial de alto contraste.",
      background: "Fondo limpio.",
      emotion: "Curiosidad.",
      textDensity: "Baja",
      subjectScale: "Grande",
      colorPalette: ["amarillo", "negro"],
      focalElements: ["rostro", "titular"],
      replaceableElements: ["persona", "texto"],
    },
  };
  assert.equal(validateGenerationInput(recreate).success, true);
  const missingRole = validateGenerationInput({
    ...recreate,
    recreateReferenceRoles: [],
  });
  assert.equal(missingRole.success, false);
  if (!missingRole.success) assert.ok(missingRole.fields.recreateReferenceRoles);
  const pendingAnalysis = validateGenerationInput({
    ...recreate,
    recreateElementAnalyses: undefined,
  });
  assert.equal(pendingAnalysis.success, true);
  if (pendingAnalysis.success) {
    assert.deepEqual(pendingAnalysis.data.recreateElementAnalyses, [null]);
  }
  const mismatchedAnalysis = validateGenerationInput({
    ...recreate,
    recreateElementAnalyses: [],
  });
  assert.equal(mismatchedAnalysis.success, false);
  if (!mismatchedAnalysis.success) {
    assert.ok(mismatchedAnalysis.fields.recreateElementAnalyses);
  }
  const invalidPreservation = validateGenerationInput({
    ...recreate,
    recreatePreservation: {
      ...recreate.recreatePreservation,
      pose: "yes",
    },
  });
  assert.equal(invalidPreservation.success, false);
  if (!invalidPreservation.success) {
    assert.ok(invalidPreservation.fields.recreatePreservation);
  }
});

test("Recreate accepts one base reference plus four analyzed elements", () => {
  const referenceUploadIds = [
    "8c9f0c30-7932-4ec1-9eb1-369f4fac0321",
    "4ed245f2-01dc-4294-a482-71b78e3cd08d",
    "a1f5b3e0-a60d-4889-8b95-119f618422ea",
    "07e86096-9c80-4d62-a2aa-35cf0265c5cd",
    "ab86a394-ebf1-4413-a47f-4dff1ad7d437",
  ];
  const analyses = referenceUploadIds.slice(1).map((_, index) => ({
    kind: index === 0 ? "person" : "object",
    recommendedRole: index === 0 ? "protagonist" : "supporting",
    faceCount: index === 0 ? 1 : 0,
    primarySubject: `Elemento ${index + 1}`,
    identityAnchors: ["rasgo visible"],
    placementGuidance: "Mantener su función visual.",
    warnings: [],
  }));
  const result = validateGenerationInput({
    ...validInput,
    creationMode: "recreate",
    referenceUploadIds,
    recreateReferenceRoles: ["protagonist", "supporting", "supporting", "supporting"],
    recreateElementAnalyses: analyses,
    recreateBlueprint: {
      category: "thumbnail",
      composition: "Sujeto a la derecha y texto a la izquierda.",
      hierarchy: "Sujeto, texto y fondo.",
      visualStyle: "Editorial.",
      background: "Profundo.",
      emotion: "Curiosidad.",
      textDensity: "Baja.",
      subjectScale: "Grande.",
      colorPalette: [],
      focalElements: [],
      replaceableElements: [],
    },
  });
  assert.equal(result.success, true);
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
  for (const style of GENERATION_STYLES.filter((item) => item.previewAsset)) {
    assert.ok(style.promptGuidelines.length >= 4, style.id);
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
