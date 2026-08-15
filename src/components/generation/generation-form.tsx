"use client";

import {
  ArrowRight,
  Check,
  CircleUserRound,
  Crown,
  Image as ImageIcon,
  LoaderCircle,
  MonitorPlay,
  PanelsTopLeft,
  Plus,
  RectangleHorizontal,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  ReferenceImagePicker,
  type ReferenceDraft,
} from "@/components/generation/reference-image-picker";
import { CREATION_QUEUED_EVENT } from "@/components/dashboard/creation-notification-center";
import {
  GENERATION_PRODUCTS,
  PROFILE_BACKGROUNDS,
  PROFILE_INTENSITIES,
  PROFILE_MODES,
  getDefaultQuality,
  getGenerationProduct,
  getGenerationVariant,
  getSelectableVariants,
  getSupportedQualities,
  getVariantForPlatform,
} from "@/config/generation-products";
import { GENERATION_COLORS, GENERATION_STYLES } from "@/config/generation";
import {
  THUMBNAIL_PRESETS,
  THUMBNAIL_TEXT_MODES,
} from "@/config/thumbnail-creation";
import { isVisualStyleCompatible } from "@/config/visual-styles";
import { trackConversion } from "@/lib/analytics/events";
import { normalizeHexColor } from "@/lib/colors/normalize-hex-color";
import { getGenerationCreditCost } from "@/lib/credits/get-generation-credit-cost";
import {
  publishCreditBalance,
  requestCreditBalanceRefresh,
  useCreditBalance,
} from "@/lib/credits/client-credit-balance";
import { cn } from "@/lib/utils";
import { readApiResponse } from "@/lib/uploads/read-api-response";
import { uploadPrivateImage } from "@/lib/uploads/upload-private-image";
import type {
  ColorPreference,
  ContentType,
  GenerationErrorResponse,
  GenerationFormat,
  GenerationPlatform,
  GenerationQuality,
  GenerationStyle,
  ProfileBackground,
  ProfileIntensity,
  ProfileMode,
  ThumbnailPreset,
  ThumbnailTextMode,
} from "@/types/generation";
import type { QueuedGenerationResponse } from "@/types/jobs";
import type { BrandStyle, StyleConsistency } from "@/types/brand-style";
import type { BrandStyleEntitlement } from "@/config/brand-styles";

const contentIcons = {
  "monitor-play": MonitorPlay,
  image: ImageIcon,
  "rectangle-horizontal": RectangleHorizontal,
  "panels-top-left": PanelsTopLeft,
  smartphone: Smartphone,
  "circle-user-round": CircleUserRound,
} as const;

const platformLabels: Record<GenerationPlatform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  generic: "Genérica",
};

const creationHeadlines: Record<ContentType, string> = {
  thumbnail: "Haz que tu video empiece antes del play.",
  "social-post": "Crea una idea que detenga el scroll.",
  banner: "Dale a tu campaña el espacio que merece.",
  "social-cover": "Haz que tu marca se reconozca al instante.",
  story: "Cuenta algo que se entienda en un segundo.",
  "profile-image": "Crea una imagen que realmente te represente.",
};

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export function GenerationForm({
  available,
  availableCredits,
  maxReferenceFileMb,
  initialContentType,
  brandStyles,
  brandStyleEntitlement,
  initialBrandStyleId,
}: {
  available: boolean;
  availableCredits: number | null;
  maxReferenceFileMb: number;
  initialContentType?: ContentType;
  brandStyles: BrandStyle[];
  brandStyleEntitlement: BrandStyleEntitlement;
  initialBrandStyleId?: string;
}) {
  const currentAvailableCredits = useCreditBalance(availableCredits);
  const initialProduct = getGenerationProduct(
    initialContentType ?? "thumbnail",
  );
  const [contentType, setContentType] = useState<ContentType>(
    initialProduct.id,
  );
  const [platform, setPlatform] = useState<GenerationPlatform | undefined>(
    initialProduct.defaultPlatform,
  );
  const [variant, setVariant] = useState<GenerationFormat>(
    initialProduct.defaultVariant,
  );
  const [quality, setQuality] = useState<GenerationQuality>(() =>
    getDefaultQuality(getGenerationVariant(initialProduct.defaultVariant)!),
  );
  const [description, setDescription] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [thumbnailPreset, setThumbnailPreset] =
    useState<ThumbnailPreset>("impactful");
  const [thumbnailTextMode, setThumbnailTextMode] =
    useState<ThumbnailTextMode>("automatic");
  const [brandStyleId, setBrandStyleId] = useState(() =>
    brandStyles.some((item) => item.id === initialBrandStyleId)
      ? initialBrandStyleId
      : undefined,
  );
  const [styleConsistency, setStyleConsistency] =
    useState<StyleConsistency>("balanced");
  const [style, setStyle] = useState<GenerationStyle>("automatic");
  const [colorPreference, setColorPreference] =
    useState<ColorPreference>("auto");
  const [customColors, setCustomColors] = useState(["#DDF527", "#10110D"]);
  const [hexDrafts, setHexDrafts] = useState(["#DDF527", "#10110D"]);
  const [profileMode, setProfileMode] = useState<ProfileMode>("professional");
  const [profileIntensity, setProfileIntensity] =
    useState<ProfileIntensity>("balanced");
  const [profileBackground, setProfileBackground] =
    useState<ProfileBackground>("neutral");
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [projectId, setProjectId] = useState<string>();
  const [result, setResult] = useState<SubmitState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<ReferenceDraft[]>([]);
  const referencesRef = useRef(references);

  useEffect(() => {
    referencesRef.current = references;
  }, [references]);
  useEffect(
    () => () => {
      referencesRef.current.forEach((reference) =>
        URL.revokeObjectURL(reference.previewUrl),
      );
    },
    [],
  );

  const product = getGenerationProduct(contentType);
  const variantDefinition = getGenerationVariant(variant)!;
  const selectableVariants =
    contentType === "social-cover"
      ? [variantDefinition]
      : getSelectableVariants(contentType);
  const supportedQualities = getSupportedQualities(variantDefinition);
  const creditCost = getGenerationCreditCost({
    contentType,
    variant,
    platform,
    quality,
  });
  const hasEnoughCredits =
    currentAvailableCredits === null || currentAvailableCredits >= creditCost;
  const styles = useMemo(
    () =>
      GENERATION_STYLES.filter((item) =>
        isVisualStyleCompatible(item.id, contentType),
      ),
    [contentType],
  );

  function selectContentType(nextType: ContentType) {
    const next = getGenerationProduct(nextType);
    setContentType(nextType);
    setPlatform(next.defaultPlatform);
    setVariant(next.defaultVariant);
    setQuality(getDefaultQuality(getGenerationVariant(next.defaultVariant)!));
    setStyle("automatic");
    setBrandStyleId((current) =>
      current &&
      brandStyles
        .find((item) => item.id === current)
        ?.supportedDesignTypes.includes(nextType)
        ? current
        : undefined,
    );
    setProjectId(undefined);
    setResult({ status: "idle" });
    setFieldErrors({});
  }

  function selectPlatform(nextPlatform: GenerationPlatform) {
    setPlatform(nextPlatform);
    if (contentType === "social-cover") {
      const nextVariant = getVariantForPlatform(contentType, nextPlatform);
      setVariant(nextVariant.id);
      setQuality((current) =>
        getSupportedQualities(nextVariant).includes(current)
          ? current
          : getDefaultQuality(nextVariant),
      );
    }
  }

  function selectQuality(nextQuality: GenerationQuality) {
    if (getSupportedQualities(variantDefinition).includes(nextQuality)) {
      setQuality(nextQuality);
    }
  }

  function selectVariant(nextVariant: GenerationFormat) {
    const definition = getGenerationVariant(nextVariant)!;
    setVariant(nextVariant);
    setQuality((current) =>
      getSupportedQualities(definition).includes(current)
        ? current
        : getDefaultQuality(definition),
    );
  }

  async function submitGeneration(event: FormEvent) {
    event.preventDefault();
    if (!available || !hasEnoughCredits || result.status === "loading") return;
    setResult({ status: "loading" });
    setFieldErrors({});

    try {
      const referenceUploadIds = await Promise.all(
        references.map(async (reference) => {
          if (reference.uploadId) return reference.uploadId;
          setReferences((current) =>
            current.map((item) =>
              item.key === reference.key
                ? { ...item, status: "uploading" }
                : item,
            ),
          );
          try {
            const upload = await uploadPrivateImage(
              reference.file,
              "reference",
            );
            setReferences((current) =>
              current.map((item) =>
                item.key === reference.key
                  ? { ...item, uploadId: upload.uploadId, status: "uploaded" }
                  : item,
              ),
            );
            return upload.uploadId;
          } catch (error) {
            setReferences((current) =>
              current.map((item) =>
                item.key === reference.key
                  ? { ...item, status: "error" }
                  : item,
              ),
            );
            throw error;
          }
        }),
      );

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: crypto.randomUUID(),
          projectId,
          contentType,
          platform,
          description,
          primaryText: product.acceptsText
            ? primaryText.trim() || undefined
            : undefined,
          style,
          colorPreference,
          customColors: colorPreference === "custom" ? customColors : undefined,
          variant,
          format: variant,
          quality,
          referenceUploadIds: referenceUploadIds.length
            ? referenceUploadIds
            : undefined,
          profileMode:
            contentType === "profile-image" ? profileMode : undefined,
          profileIntensity:
            contentType === "profile-image" ? profileIntensity : undefined,
          profileBackground:
            contentType === "profile-image" ? profileBackground : undefined,
          showSafeArea: contentType === "story" ? showSafeArea : undefined,
          videoTitle:
            contentType === "thumbnail"
              ? videoTitle.trim() || undefined
              : undefined,
          thumbnailPreset:
            contentType === "thumbnail" ? thumbnailPreset : undefined,
          thumbnailTextMode:
            contentType === "thumbnail" ? thumbnailTextMode : undefined,
          brandStyleId,
          styleConsistency: brandStyleId ? styleConsistency : undefined,
        }),
      });
      const payload = await readApiResponse<
        QueuedGenerationResponse | GenerationErrorResponse
      >(response, "No pudimos completar la generación.");
      if (!response.ok || "error" in payload) {
        if ("fields" in payload && payload.fields)
          setFieldErrors(payload.fields);
        throw new Error(
          "error" in payload
            ? payload.error
            : "No pudimos completar la generación.",
        );
      }
      trackConversion("generation_started", {
        content_type: contentType,
        platform,
        style,
        variant,
        credit_cost: creditCost,
      });
      publishCreditBalance(payload.availableCredits);
      window.dispatchEvent(
        new CustomEvent(CREATION_QUEUED_EVENT, {
          detail: {
            jobId: payload.jobId,
            generationId: payload.generationId,
            label: `${product.label} · ${variantDefinition.width} × ${variantDefinition.height}`,
            status: payload.status,
            createdAt: new Date().toISOString(),
            unread: true,
          },
        }),
      );
      setProjectId(undefined);
      setDescription("");
      setPrimaryText("");
      setVideoTitle("");
      setResult({ status: "idle" });
    } catch (error) {
      requestCreditBalanceRefresh();
      const message =
        error instanceof TypeError && /failed to fetch/i.test(error.message)
          ? "No pudimos conectar con Crealy. Revisa tu conexión e inténtalo otra vez."
          : error instanceof Error
            ? error.message
            : "No pudimos completar la generación.";
      setResult({
        status: "error",
        message,
      });
    }
  }

  return (
    <form
      onSubmit={submitGeneration}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="min-w-0 rounded-2xl bg-surface p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:p-8">
        <div className="max-w-3xl border-b border-white/10 pb-7">
          <h1
            aria-live="polite"
            className="min-h-[2.25em] text-balance text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl"
          >
            <span key={contentType} className="creation-heading-swap block">
              {creationHeadlines[contentType]}
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Empieza eligiendo qué vas a crear. Crealy preparará las medidas, la
            calidad y el coste correctos para cada destino.
          </p>
          <div className="mt-5 flex items-center gap-3 text-xs font-semibold text-foreground/75">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-brand shadow-[0_0_18px_rgba(221,245,39,.38)]"
            />
            <span
              key={`${contentType}-label`}
              className="creation-heading-swap"
            >
              Preparando {product.fullLabel.toLowerCase()}
            </span>
          </div>
        </div>

        <nav
          aria-label="Pasos de creación"
          className="sticky top-[4.85rem] z-20 -mx-2 mt-5 flex max-w-[calc(100%+1rem)] gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-white/10 bg-surface-elevated/96 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,.3)] backdrop-blur-xl [scrollbar-width:none] sm:hidden"
        >
          {[
            ["#creation-format", "1", "Formato"],
            ["#creation-idea", "2", "Idea"],
            ["#creation-direction", "3", "Dirección"],
            ["#creation-summary", "4", "Generar"],
          ].map(([href, step, label]) => (
            <a
              key={href}
              href={href}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-muted active:bg-white/[0.06] active:text-foreground"
            >
              <span className="grid size-5 place-items-center rounded-md bg-brand/12 text-[0.625rem] text-brand">
                {step}
              </span>
              {label}
            </a>
          ))}
        </nav>

        <fieldset id="creation-format" className="scroll-mt-40 mt-9">
          <legend className="text-sm font-semibold text-foreground">
            ¿Qué vas a crear?
          </legend>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
            {GENERATION_PRODUCTS.map((item) => {
              const Icon = contentIcons[item.icon as keyof typeof contentIcons];
              const selected = item.id === contentType;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectContentType(item.id)}
                  className={cn(
                    "min-w-0 min-h-24 rounded-xl px-4 py-3 text-left transition-[background-color,color,box-shadow] focus-visible:outline-brand",
                    selected
                      ? "bg-brand text-brand-ink shadow-[0_14px_34px_rgba(221,245,39,.12)]"
                      : "bg-background text-muted hover:bg-white/[0.055] hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  <span className="mt-4 block break-words text-sm font-bold">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block break-words text-xs",
                      selected ? "text-black/65" : "text-muted",
                    )}
                  >
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
          {fieldErrors.contentType ? (
            <FieldError message={fieldErrors.contentType} />
          ) : null}
        </fieldset>

        {product.platforms.length ? (
          <fieldset className="mt-7">
            <legend className="text-sm font-semibold text-foreground">
              Plataforma
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.platforms.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={platform === item}
                  onClick={() => selectPlatform(item)}
                  className={cn(
                    "min-h-11 rounded-xl px-4 text-sm font-semibold transition-colors",
                    platform === item
                      ? "bg-white text-black"
                      : "bg-background text-muted hover:text-foreground",
                  )}
                >
                  {platformLabels[item]}
                </button>
              ))}
            </div>
            {fieldErrors.platform ? (
              <FieldError message={fieldErrors.platform} />
            ) : null}
          </fieldset>
        ) : null}

        {contentType !== "thumbnail" && selectableVariants.length > 1 ? (
          <fieldset className="mt-7">
            <legend className="text-sm font-semibold text-foreground">
              Tamaño
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {selectableVariants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={variant === item.id}
                  onClick={() => selectVariant(item.id)}
                  className={cn(
                    "rounded-xl p-4 text-left transition-colors",
                    variant === item.id
                      ? "bg-brand/[0.09] ring-1 ring-brand/65"
                      : "bg-background hover:bg-white/[0.055]",
                  )}
                >
                  <span className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm font-bold text-foreground">
                    {item.label}
                    {item.recommended ? (
                      <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] text-brand-ink">
                        Recomendado
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {item.shortLabel}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {supportedQualities.length > 1 ? (
          <fieldset className="mt-7">
            <legend className="text-sm font-semibold text-foreground">
              Calidad
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {supportedQualities.map((item) => {
                const cost = getGenerationCreditCost({
                  contentType,
                  variant,
                  platform,
                  quality: item,
                });
                const selected = quality === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectQuality(item)}
                    className={cn(
                      "rounded-xl p-4 text-left transition-colors",
                      selected
                        ? "bg-brand/[0.09] text-foreground ring-1 ring-brand/65"
                        : "bg-background text-muted hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center justify-between gap-3 text-sm font-bold">
                      {item === "high" ? "Alta calidad" : "Estándar"}
                      <span className="text-xs text-brand">
                        {cost} {cost === 1 ? "crédito" : "créditos"}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {item === "high"
                        ? "Más detalle para la versión final."
                        : "Ideal para explorar ideas y publicar."}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : variantDefinition.id === "cover-youtube" ? (
          <div className="mt-7 rounded-xl bg-brand/[0.07] p-4 ring-1 ring-brand/25">
            <p className="text-sm font-semibold text-foreground">
              Alta calidad incluida
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              La portada de YouTube siempre se genera en 2560 × 1440 con máxima
              calidad.
            </p>
          </div>
        ) : null}

        <div id="creation-idea" className="scroll-mt-40 mt-8">
          <label
            htmlFor="description"
            className="text-sm font-semibold text-foreground"
          >
            {contentType === "thumbnail"
              ? "¿De qué trata tu video?"
              : "Describe la pieza"}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={contentType === "thumbnail" ? 3 : 10}
            maxLength={1500}
            required
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby="description-help"
            rows={5}
            placeholder={
              contentType === "thumbnail"
                ? "Ejemplo: Probé ChatGPT durante 30 días para crear un negocio"
                : product.example
            }
            className="mt-3 w-full resize-y rounded-xl bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none ring-1 ring-white/10 transition-shadow placeholder:text-white/35 focus:ring-brand/65"
          />
          <div
            id="description-help"
            className="mt-2 flex justify-between gap-4 text-xs text-muted"
          >
            <span>
              {fieldErrors.description ??
                (contentType === "thumbnail"
                  ? "Puedes escribir una idea corta o el título completo del video."
                  : "Explica el objetivo, el sujeto y qué debe destacar.")}
            </span>
            <span>{description.length}/1500</span>
          </div>
        </div>

        {contentType === "thumbnail" ? (
          <div className="mt-6">
            <label
              htmlFor="videoTitle"
              className="text-sm font-semibold text-foreground"
            >
              Título del video{" "}
              <span className="font-normal text-muted">(opcional)</span>
            </label>
            <input
              id="videoTitle"
              value={videoTitle}
              onChange={(event) => setVideoTitle(event.target.value)}
              maxLength={240}
              placeholder="Ej. Construí un negocio con IA en 30 días"
              className="mt-3 h-12 w-full rounded-xl bg-background px-4 text-sm text-foreground outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-brand/65"
            />
            <p className="mt-2 text-xs leading-5 text-muted">
              Ayuda a crear una miniatura que complemente el título sin
              repetirlo.
            </p>
            {fieldErrors.videoTitle ? (
              <FieldError message={fieldErrors.videoTitle} />
            ) : null}
          </div>
        ) : null}

        {contentType === "thumbnail" ? (
          <fieldset className="mt-7">
            <legend className="text-sm font-semibold text-foreground">
              Dirección visual
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {THUMBNAIL_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={thumbnailPreset === item.id}
                  onClick={() => setThumbnailPreset(item.id)}
                  className={cn(
                    "rounded-xl p-4 text-left transition-colors",
                    thumbnailPreset === item.id
                      ? "bg-brand/[0.09] ring-1 ring-brand/65"
                      : "bg-background hover:bg-white/[0.055]",
                  )}
                >
                  <span className="flex items-center justify-between text-sm font-semibold text-foreground">
                    {item.label}
                    {thumbnailPreset === item.id ? (
                      <Check aria-hidden="true" className="size-4 text-brand" />
                    ) : null}
                  </span>
                  <span className="mt-1.5 block text-xs leading-5 text-muted">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
            {fieldErrors.thumbnailPreset ? (
              <FieldError message={fieldErrors.thumbnailPreset} />
            ) : null}
          </fieldset>
        ) : null}

        {!brandStyleEntitlement.enabled &&
        ["thumbnail", "banner", "social-post", "social-cover"].includes(
          contentType,
        ) ? (
          <section className="mt-7 rounded-xl border border-brand/20 bg-brand/[0.035] p-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Crown aria-hidden="true" className="size-4 text-brand" /> Firma
                visual{" "}
                <span className="text-xs font-semibold text-brand">
                  Creator · Pro
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">
                Mantén la identidad de tu marca en cada nueva creación.
              </p>
            </div>
            <Link
              href="/my-style"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-brand sm:mt-0"
            >
              Descubrir la función <ArrowRight className="size-3.5" />
            </Link>
          </section>
        ) : brandStyles.some((item) =>
            item.supportedDesignTypes.includes(contentType),
          ) ? (
          <fieldset className="mt-7">
            <legend className="text-sm font-semibold text-foreground">
              Firma visual
            </legend>
            <p className="mt-1 text-xs leading-5 text-muted">
              Mantén la identidad de tu marca sin copiar tus diseños anteriores.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={!brandStyleId}
                onClick={() => setBrandStyleId(undefined)}
                className={cn(
                  "rounded-xl p-4 text-left transition-colors",
                  !brandStyleId
                    ? "bg-brand/[0.09] ring-1 ring-brand/65"
                    : "bg-background ring-1 ring-white/10 hover:bg-white/[0.04]",
                )}
              >
                <span className="flex items-center justify-between text-sm font-semibold text-foreground">
                  Automático
                  {!brandStyleId ? (
                    <Check className="size-4 text-brand" />
                  ) : null}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Crealy decide la dirección para esta idea.
                </span>
              </button>
              {brandStyles
                .filter(
                  (item) =>
                    item.analysisStatus === "ready" &&
                    item.supportedDesignTypes.includes(contentType),
                )
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={brandStyleId === item.id}
                    onClick={() => {
                      setBrandStyleId(item.id);
                      trackConversion("brand_style_selected", {
                        content_type: contentType,
                      });
                    }}
                    className={cn(
                      "overflow-hidden rounded-xl p-4 text-left transition-colors",
                      brandStyleId === item.id
                        ? "bg-brand/[0.09] ring-1 ring-brand/65"
                        : "bg-background ring-1 ring-white/10 hover:bg-white/[0.04]",
                    )}
                  >
                    <span className="flex items-center justify-between text-sm font-semibold text-foreground">
                      {item.name}
                      {brandStyleId === item.id ? (
                        <Check className="size-4 text-brand" />
                      ) : null}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted">
                      {item.visualSummary}
                    </span>
                  </button>
                ))}
            </div>
            {brandStyleId ? (
              <div className="mt-4 rounded-xl bg-background p-4 ring-1 ring-white/10">
                <label
                  htmlFor="styleConsistency"
                  className="text-xs font-semibold text-foreground"
                >
                  Consistencia del estilo
                </label>
                <select
                  id="styleConsistency"
                  value={styleConsistency}
                  onChange={(event) =>
                    setStyleConsistency(event.target.value as StyleConsistency)
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-surface px-3 text-sm text-foreground outline-none focus:border-brand/60"
                >
                  <option value="flexible">Flexible</option>
                  <option value="balanced">Equilibrada</option>
                  <option value="strict">Muy consistente</option>
                </select>
              </div>
            ) : null}
            <Link
              href="/my-style"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
            >
              Crear nueva firma visual <ArrowRight className="size-3.5" />
            </Link>
          </fieldset>
        ) : null}

        {contentType === "thumbnail" ? (
          <fieldset className="mt-7">
            <legend className="text-sm font-semibold text-foreground">
              Texto de la miniatura
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {THUMBNAIL_TEXT_MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={thumbnailTextMode === item.id}
                  onClick={() => setThumbnailTextMode(item.id)}
                  className={cn(
                    "rounded-xl p-4 text-left transition-colors",
                    thumbnailTextMode === item.id
                      ? "bg-brand/[0.09] ring-1 ring-brand/65"
                      : "bg-background hover:bg-white/[0.055]",
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="mt-1.5 block text-xs leading-5 text-muted">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
            {thumbnailTextMode === "custom" ? (
              <div className="mt-3">
                <label htmlFor="primaryText" className="sr-only">
                  Texto exacto
                </label>
                <input
                  id="primaryText"
                  value={primaryText}
                  onChange={(event) => setPrimaryText(event.target.value)}
                  maxLength={80}
                  placeholder="Ej. SOLO UNA SIRVE"
                  className="h-12 w-full rounded-xl bg-background px-4 text-sm text-foreground outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-brand/65"
                />
                <p className="mt-2 text-xs text-muted">
                  Máximo cinco palabras.
                </p>
              </div>
            ) : null}
            {fieldErrors.thumbnailTextMode ? (
              <FieldError message={fieldErrors.thumbnailTextMode} />
            ) : null}
            {fieldErrors.primaryText ? (
              <FieldError message={fieldErrors.primaryText} />
            ) : null}
          </fieldset>
        ) : product.acceptsText ? (
          <div className="mt-6">
            <label
              htmlFor="primaryText"
              className="text-sm font-semibold text-foreground"
            >
              Texto visible{" "}
              <span className="font-normal text-muted">(opcional)</span>
            </label>
            <input
              id="primaryText"
              value={primaryText}
              onChange={(event) => setPrimaryText(event.target.value)}
              maxLength={120}
              placeholder="Ej. Crea más. Publica mejor."
              className="mt-3 h-12 w-full rounded-xl bg-background px-4 text-sm text-foreground outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-brand/65"
            />
            <p className="mt-2 text-xs leading-5 text-muted">
              Usa una frase breve. La tipografía generada puede variar
              ligeramente.
            </p>
          </div>
        ) : null}

        <div id="creation-direction" className="scroll-mt-40 mt-6">
          <ReferenceImagePicker
            references={references}
            setReferences={setReferences}
            maxFileMb={maxReferenceFileMb}
            maxFiles={contentType === "thumbnail" ? 1 : 4}
            disabled={result.status === "loading"}
          />
          {contentType === "profile-image" ? (
            <p className="mt-3 flex gap-2 text-xs leading-5 text-muted">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
              />
              Sube una foto, logo u objeto si necesitas fidelidad. Conservaremos
              sus rasgos y geometría, aunque toda generación puede presentar
              variaciones.
            </p>
          ) : null}
        </div>

        {contentType !== "thumbnail" ? (
          <fieldset className="mt-7">
            <legend className="text-sm font-semibold text-foreground">
              Estilo visual
            </legend>
            <div className="-mx-1 mt-3 flex snap-x gap-2 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
              {styles.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={style === item.id}
                  onClick={() => setStyle(item.id)}
                  className={cn(
                    "group relative min-w-40 snap-start overflow-hidden rounded-xl bg-background text-left outline-none ring-1 focus-visible:ring-2 focus-visible:ring-brand sm:min-w-0",
                    style === item.id ? "ring-brand/70" : "ring-white/10",
                  )}
                >
                  <span className="relative block aspect-[16/9] overflow-hidden bg-[#171812]">
                    {item.previewAsset ? (
                      <Image
                        src={item.previewAsset}
                        alt={`Ejemplo de estilo ${item.label}`}
                        fill
                        sizes="180px"
                        className="object-cover opacity-80 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-2xl text-brand">
                        ✦
                      </span>
                    )}
                  </span>
                  <span className="flex items-center justify-between gap-2 px-3 py-3 text-xs font-semibold text-foreground">
                    {item.label}
                    {style === item.id ? (
                      <Check
                        aria-hidden="true"
                        className="size-3.5 text-brand"
                      />
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {contentType !== "thumbnail" ? (
          <div className="mt-7">
            <label
              htmlFor="colorPreference"
              className="text-sm font-semibold text-foreground"
            >
              Color
            </label>
            <select
              id="colorPreference"
              value={colorPreference}
              onChange={(event) =>
                setColorPreference(event.target.value as ColorPreference)
              }
              className="mt-3 h-12 w-full rounded-xl bg-background px-3 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-brand/65"
            >
              {GENERATION_COLORS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {colorPreference === "custom" ? (
              <ColorPalette
                colors={customColors}
                drafts={hexDrafts}
                setColors={setCustomColors}
                setDrafts={setHexDrafts}
                setFieldErrors={setFieldErrors}
                error={fieldErrors.customColors}
              />
            ) : null}
          </div>
        ) : null}

        {contentType === "profile-image" ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-3">
            <SelectField
              label="Modo"
              value={profileMode}
              onChange={(value) => setProfileMode(value as ProfileMode)}
              options={PROFILE_MODES}
            />
            <SelectField
              label="Transformación"
              value={profileIntensity}
              onChange={(value) =>
                setProfileIntensity(value as ProfileIntensity)
              }
              options={PROFILE_INTENSITIES}
            />
            <SelectField
              label="Fondo"
              value={profileBackground}
              onChange={(value) =>
                setProfileBackground(value as ProfileBackground)
              }
              options={PROFILE_BACKGROUNDS}
            />
          </div>
        ) : null}

        {contentType === "story" ? (
          <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-xl bg-background p-4">
            <input
              type="checkbox"
              checked={showSafeArea}
              onChange={(event) => setShowSafeArea(event.target.checked)}
              className="mt-0.5 size-4 accent-[#DDF527]"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Proteger zona segura 9:16
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                Evita colocar texto o rostros bajo los controles de la
                plataforma.
              </span>
            </span>
          </label>
        ) : null}

        {result.status === "error" ? (
          <div
            role="alert"
            className="mt-7 rounded-xl bg-red-950/40 px-4 py-3 text-sm leading-6 text-red-100"
          >
            <strong className="block font-semibold">
              No pudimos preparar la generación.
            </strong>
            {result.message}
          </div>
        ) : null}

        <div
          id="creation-summary"
          role="status"
          aria-live="polite"
          className="scroll-mt-40 mt-7 rounded-xl bg-background p-4 lg:hidden"
        >
          <p className="text-xs font-semibold text-brand">Resumen de salida</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {variantDefinition.width} × {variantDefinition.height} ·{" "}
            {creditCost} {creditCost === 1 ? "crédito" : "créditos"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Saldo después de generar:{" "}
            {currentAvailableCredits === null
              ? "se verificará al enviar"
              : Math.max(0, currentAvailableCredits - creditCost)}
          </p>
        </div>

        <button
          type="submit"
          disabled={
            !available || !hasEnoughCredits || result.status === "loading"
          }
          className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink shadow-[0_16px_40px_rgba(221,245,39,.12)] transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
        >
          {result.status === "loading" ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />{" "}
              Preparando tu creación…
            </>
          ) : (
            <>
              {contentType === "thumbnail" ? "Crear miniatura" : "Generar"} ·{" "}
              {creditCost} {creditCost === 1 ? "crédito" : "créditos"}{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
        </button>
        <p className="mx-auto mt-3 max-w-xl text-center text-xs leading-5 text-white/50">
          Conservamos tus creaciones durante 7 días en Free y Starter, 30 días
          en Creator y 90 días en Pro. Descarga lo que quieras guardar.{" "}
          <Link
            href="/terms"
            className="text-foreground underline decoration-white/30 hover:decoration-brand"
          >
            Ver política
          </Link>
        </p>
        {!hasEnoughCredits && currentAvailableCredits !== null ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-3 text-center text-sm text-amber-100"
          >
            Necesitas {creditCost - currentAvailableCredits}{" "}
            {creditCost - currentAvailableCredits === 1
              ? "crédito más"
              : "créditos más"}
            .{" "}
            <Link href="/settings/billing" className="font-semibold underline">
              Ver planes
            </Link>
          </p>
        ) : !available ? (
          <p className="mt-3 text-center text-sm text-amber-100">
            La generación está temporalmente en mantenimiento.
          </p>
        ) : null}
      </div>

      <aside aria-live="polite" className="hidden lg:sticky lg:top-24 lg:block">
        <div className="overflow-hidden rounded-2xl bg-[#10110d] shadow-[0_24px_80px_rgba(0,0,0,.3)]">
          <div className="relative min-h-64 overflow-hidden p-6">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-12 size-56 rounded-full bg-brand/[0.09] blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-brand">
                  Salida preparada
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  {product.fullLabel}
                </h2>
              </div>
              <Sparkles aria-hidden="true" className="size-5 text-brand" />
            </div>
            <div
              className={cn(
                "relative mt-8 grid max-h-52 place-items-center overflow-hidden rounded-xl bg-black/50 ring-1 ring-white/10",
                contentType === "profile-image" && "rounded-full",
              )}
              style={{
                aspectRatio: `${variantDefinition.width}/${variantDefinition.height}`,
              }}
            >
              <ImageIcon aria-hidden="true" className="size-7 text-white/25" />
              {(contentType === "story" && showSafeArea) ||
              contentType === "profile-image" ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute border border-brand/70",
                    contentType === "profile-image"
                      ? "inset-[12%] rounded-full"
                      : "inset-x-[8%] inset-y-[12%] rounded-lg",
                  )}
                />
              ) : null}
            </div>
          </div>
          <dl className="divide-y divide-white/8 border-t border-white/8 px-6">
            <SummaryRow
              label="Plataforma"
              value={platform ? platformLabels[platform] : "Uso general"}
            />
            <SummaryRow
              label="Tamaño final"
              value={`${variantDefinition.width} × ${variantDefinition.height}`}
            />
            {contentType !== "thumbnail" ? (
              <SummaryRow
                label="Calidad"
                value={quality === "high" ? "Alta" : "Estándar"}
              />
            ) : null}
            <SummaryRow
              label="Coste"
              value={`${creditCost} ${creditCost === 1 ? "crédito" : "créditos"}`}
              strong
            />
          </dl>
          <div className="border-t border-white/8 px-6 py-4 text-xs text-muted">
            Saldo después de generar:{" "}
            <strong className="text-foreground">
              {currentAvailableCredits === null
                ? "Se verificará al enviar"
                : Math.max(0, currentAvailableCredits - creditCost)}
            </strong>
          </div>
        </div>
      </aside>
    </form>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-2 text-xs text-red-200">
      {message}
    </p>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd
        className={
          strong ? "font-bold text-brand" : "font-semibold text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { id: string; label: string }[];
}) {
  return (
    <label className="text-sm font-semibold text-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 h-12 w-full rounded-xl bg-background px-3 text-sm font-normal text-foreground outline-none ring-1 ring-white/10 focus:ring-brand/65"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorPalette({
  colors,
  drafts,
  setColors,
  setDrafts,
  setFieldErrors,
  error,
}: {
  colors: string[];
  drafts: string[];
  setColors: React.Dispatch<React.SetStateAction<string[]>>;
  setDrafts: React.Dispatch<React.SetStateAction<string[]>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  error?: string;
}) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
        {colors.map((color, index) => (
          <div
            key={`${index}-${color}`}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-background px-3 ring-1 ring-white/10"
          >
            <input
              type="color"
              aria-label={`Color ${index + 1}`}
              value={color}
              onChange={(event) => {
                const next = event.target.value.toUpperCase();
                setColors((current) =>
                  current.map((item, i) => (i === index ? next : item)),
                );
                setDrafts((current) =>
                  current.map((item, i) => (i === index ? next : item)),
                );
              }}
              className="size-7 bg-transparent p-0"
            />
            <input
              aria-label={`Hexadecimal ${index + 1}`}
              value={drafts[index] ?? color}
              maxLength={7}
              onChange={(event) =>
                setDrafts((current) =>
                  current.map((item, i) =>
                    i === index ? event.target.value : item,
                  ),
                )
              }
              onBlur={() => {
                const normalized = normalizeHexColor(drafts[index] ?? "");
                if (!normalized) {
                  setFieldErrors((current) => ({
                    ...current,
                    customColors: "Usa #RGB o #RRGGBB.",
                  }));
                  return;
                }
                setColors((current) =>
                  current.map((item, i) => (i === index ? normalized : item)),
                );
                setDrafts((current) =>
                  current.map((item, i) => (i === index ? normalized : item)),
                );
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next.customColors;
                  return next;
                });
              }}
              className="min-w-0 flex-1 bg-transparent font-mono text-xs uppercase text-foreground outline-none"
            />
            {colors.length > 1 ? (
              <button
                type="button"
                aria-label={`Quitar color ${index + 1}`}
                onClick={() => {
                  setColors((current) => current.filter((_, i) => i !== index));
                  setDrafts((current) => current.filter((_, i) => i !== index));
                }}
                className="grid size-7 place-items-center text-muted hover:text-foreground"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {colors.length < 5 ? (
        <button
          type="button"
          onClick={() => {
            setColors((current) => [...current, "#FFFFFF"]);
            setDrafts((current) => [...current, "#FFFFFF"]);
          }}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-background px-3 text-xs font-semibold text-muted hover:text-foreground"
        >
          <Plus aria-hidden="true" className="size-4" /> Añadir color (
          {colors.length}/5)
        </button>
      ) : null}
      <p className={cn("mt-2 text-xs", error ? "text-red-200" : "text-muted")}>
        {error ?? `${colors.length} de 5 colores seleccionados.`}
      </p>
    </div>
  );
}
