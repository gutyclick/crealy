"use client";

import {
  ArrowRight,
  Check,
  Image as ImageIcon,
  LoaderCircle,
  MonitorPlay,
  PanelsTopLeft,
  RectangleHorizontal,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { CREATION_QUEUED_EVENT } from "@/components/dashboard/creation-notification-center";
import type { ReferenceDraft } from "@/components/generation/reference-image-picker";
import {
  RecreatePanel,
  type RecreateState,
} from "@/components/recreate/recreate-panel";
import {
  GENERATION_PRODUCTS,
  getDefaultQuality,
  getGenerationProduct,
  getGenerationVariant,
  getSelectableVariants,
  getSupportedQualities,
  getVariantForPlatform,
} from "@/config/generation-products";
import { getGenerationCreditCost } from "@/lib/credits/get-generation-credit-cost";
import { trackConversion } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { readApiResponse } from "@/lib/uploads/read-api-response";
import { uploadPrivateImage } from "@/lib/uploads/upload-private-image";
import type { BrandStyle } from "@/types/brand-style";
import type {
  GenerationErrorResponse,
  GenerationFormat,
  GenerationPlatform,
  GenerationQuality,
} from "@/types/generation";
import type { QueuedGenerationResponse } from "@/types/jobs";

const RECREATE_TYPES = [
  "thumbnail",
  "social-post",
  "banner",
  "social-cover",
] as const;
type RecreateType = (typeof RECREATE_TYPES)[number];

const icons = {
  thumbnail: MonitorPlay,
  "social-post": ImageIcon,
  banner: RectangleHorizontal,
  "social-cover": PanelsTopLeft,
};
const platformLabels: Record<GenerationPlatform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  generic: "Genérica",
};

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export function RecreateForm({
  available,
  availableCredits,
  maxReferenceFileMb,
  initialContentType = "thumbnail",
  brandStyles,
  initialBrandStyleId,
}: {
  available: boolean;
  availableCredits: number | null;
  maxReferenceFileMb: number;
  initialContentType?: RecreateType;
  brandStyles: BrandStyle[];
  initialBrandStyleId?: string;
}) {
  const initialProduct = getGenerationProduct(initialContentType);
  const [contentType, setContentType] =
    useState<RecreateType>(initialContentType);
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
  const [brandStyleId, setBrandStyleId] = useState(() =>
    brandStyles.some(
      (item) =>
        item.id === initialBrandStyleId &&
        item.analysisStatus === "ready" &&
        item.supportedDesignTypes.includes(initialContentType),
    )
      ? initialBrandStyleId
      : undefined,
  );
  const [references, setReferences] = useState<ReferenceDraft[]>([]);
  const [recreate, setRecreate] = useState<RecreateState>({
    similarity: "similar",
    focus: "composition",
    goal: "performance",
    ready: false,
  });
  const [result, setResult] = useState<SubmitState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const referencesRef = useRef(references);

  useEffect(() => {
    referencesRef.current = references;
  }, [references]);
  useEffect(
    () => () =>
      referencesRef.current.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl),
      ),
    [],
  );

  const product = getGenerationProduct(contentType);
  const definition = getGenerationVariant(variant)!;
  const variants =
    contentType === "social-cover"
      ? [definition]
      : getSelectableVariants(contentType);
  const qualities = getSupportedQualities(definition);
  const creditCost = getGenerationCreditCost({
    contentType,
    variant,
    platform,
    quality,
    creationMode: "recreate",
  });
  const hasEnoughCredits =
    availableCredits === null || availableCredits >= creditCost;
  const ready =
    recreate.ready &&
    Boolean(recreate.blueprint) &&
    Boolean(references[0]?.uploadId);
  const compatibleStyles = useMemo(
    () =>
      brandStyles.filter(
        (item) =>
          item.analysisStatus === "ready" &&
          item.supportedDesignTypes.includes(contentType),
      ),
    [brandStyles, contentType],
  );

  function selectType(nextType: RecreateType) {
    references.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    const next = getGenerationProduct(nextType);
    setContentType(nextType);
    setPlatform(next.defaultPlatform);
    setVariant(next.defaultVariant);
    setQuality(getDefaultQuality(getGenerationVariant(next.defaultVariant)!));
    setReferences([]);
    setRecreate({ similarity: "similar", focus: "composition", goal: "performance", ready: false });
    setResult({ status: "idle" });
    setFieldErrors({});
    setBrandStyleId((current) =>
      current &&
      brandStyles
        .find((item) => item.id === current)
        ?.supportedDesignTypes.includes(nextType)
        ? current
        : undefined,
    );
  }

  function selectPlatform(next: GenerationPlatform) {
    setPlatform(next);
    if (contentType === "social-cover") {
      const nextVariant = getVariantForPlatform(contentType, next);
      setVariant(nextVariant.id);
      setQuality(getDefaultQuality(nextVariant));
    }
  }

  function selectVariant(next: GenerationFormat) {
    const nextDefinition = getGenerationVariant(next)!;
    setVariant(next);
    setQuality((current) =>
      getSupportedQualities(nextDefinition).includes(current)
        ? current
        : getDefaultQuality(nextDefinition),
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !available ||
      !hasEnoughCredits ||
      !ready ||
      result.status === "loading"
    )
      return;
    setResult({ status: "loading" });
    setFieldErrors({});
    try {
      const uploadIds = await Promise.all(
        references.map(async (reference) => {
          if (reference.uploadId) return reference.uploadId;
          const upload = await uploadPrivateImage(reference.file, "reference");
          setReferences((current) =>
            current.map((item) =>
              item.key === reference.key
                ? { ...item, uploadId: upload.uploadId, status: "uploaded" }
                : item,
            ),
          );
          return upload.uploadId;
        }),
      );
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: crypto.randomUUID(),
          contentType,
          platform,
          description,
          primaryText: primaryText.trim() || undefined,
          style: "automatic",
          colorPreference: "auto",
          variant,
          format: variant,
          quality,
          referenceUploadIds: uploadIds,
          brandStyleId,
          styleConsistency: brandStyleId ? "balanced" : undefined,
          creationMode: "recreate",
          recreateSimilarity: recreate.similarity,
          recreateBlueprint: recreate.blueprint,
          recreateFocus: recreate.focus,
          recreateGoal: recreate.goal,
        }),
      });
      const payload = await readApiResponse<
        QueuedGenerationResponse | GenerationErrorResponse
      >(response, "No pudimos preparar la recreación.");
      if (!response.ok || "error" in payload) {
        if ("fields" in payload && payload.fields)
          setFieldErrors(payload.fields);
        throw new Error(
          "error" in payload
            ? payload.error
            : "No pudimos preparar la recreación.",
        );
      }
      trackConversion("generation_started", {
        content_type: contentType,
        platform,
        style: "automatic",
        variant,
        credit_cost: creditCost,
      });
      window.dispatchEvent(
        new CustomEvent(CREATION_QUEUED_EVENT, {
          detail: {
            jobId: payload.jobId,
            generationId: payload.generationId,
            label: `Recreate · ${definition.width} × ${definition.height}`,
            status: payload.status,
            createdAt: new Date().toISOString(),
            unread: true,
          },
        }),
      );
      setDescription("");
      setPrimaryText("");
      setResult({ status: "idle" });
    } catch (error) {
      setResult({
        status: "error",
        message:
          error instanceof TypeError && /failed to fetch/i.test(error.message)
            ? "No pudimos conectar con Crealy. Revisa tu conexión e inténtalo otra vez."
            : error instanceof Error
              ? error.message
              : "No pudimos preparar la recreación.",
      });
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="min-w-0 rounded-2xl bg-surface p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:p-8">
        <header className="border-b border-white/10 pb-7">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Recrea una fórmula. Hazla tuya.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Añade un diseño que ya funciona y cuéntanos tu nueva idea. Crealy
            conservará su lógica visual sin copiar su contenido.
          </p>
        </header>

        <nav aria-label="Pasos de Recreate" className="sticky top-[4.85rem] z-20 -mx-2 mt-5 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-surface-elevated/96 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,.3)] backdrop-blur-xl sm:hidden">
          {[["#recreate-format", "1", "Formato"], ["#recreate-reference", "2", "Referencia"], ["#recreate-idea", "3", "Tu versión"], ["#recreate-submit", "4", "Generar"]].map(([href, step, label]) => (
            <a key={href} href={href} className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-muted active:bg-white/[0.06] active:text-foreground">
              <span className="grid size-5 place-items-center rounded-md bg-brand/12 text-[0.625rem] text-brand">{step}</span>{label}
            </a>
          ))}
        </nav>

        <fieldset id="recreate-format" className="scroll-mt-40 mt-8">
          <legend className="text-sm font-semibold text-foreground">
            ¿Qué quieres recrear?
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RECREATE_TYPES.map((id) => {
              const item = GENERATION_PRODUCTS.find(
                (candidate) => candidate.id === id,
              )!;
              const Icon = icons[id];
              const selected = contentType === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectType(id)}
                  className={cn(
                    "min-h-24 rounded-xl p-4 text-left transition-colors",
                    selected
                      ? "bg-brand text-brand-ink"
                      : "bg-background text-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  <span className="mt-4 block text-sm font-bold">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {product.platforms.length ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-foreground">
              Destino
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.platforms.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={platform === item}
                  onClick={() => selectPlatform(item)}
                  className={cn(
                    "min-h-11 rounded-xl px-4 text-sm font-semibold",
                    platform === item
                      ? "bg-white text-black"
                      : "bg-background text-muted hover:text-foreground",
                  )}
                >
                  {platformLabels[item]}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {variants.length > 1 ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-foreground">
              Formato
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {variants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={variant === item.id}
                  onClick={() => selectVariant(item.id)}
                  className={cn(
                    "rounded-xl p-4 text-left ring-1",
                    variant === item.id
                      ? "bg-brand/[.08] ring-brand/60"
                      : "bg-background ring-white/10",
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {item.shortLabel}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {qualities.length > 1 ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-foreground">
              Calidad
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {qualities.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={quality === item}
                  onClick={() => setQuality(item)}
                  className={cn(
                    "rounded-xl p-4 text-left ring-1",
                    quality === item
                      ? "bg-brand/[.08] ring-brand/60"
                      : "bg-background ring-white/10",
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {item === "high" ? "Alta calidad" : "Estándar"}
                  </span>
                  <span className="mt-1 block text-xs text-brand">
                    {getGenerationCreditCost({
                      contentType,
                      variant,
                      platform,
                      quality: item,
                      creationMode: "recreate",
                    })} créditos
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div id="recreate-reference" className="scroll-mt-40">
          <RecreatePanel
            key={contentType}
            category={contentType}
            references={references}
            setReferences={setReferences}
            disabled={result.status === "loading"}
            maxFileMb={maxReferenceFileMb}
            onChange={(next) =>
              setRecreate((current) => ({
                ...current,
                ...next,
                blueprint: next.blueprint ?? current.blueprint,
              }))
            }
          />
        </div>

        <section id="recreate-idea" className="scroll-mt-40 mt-8 border-t border-white/10 pt-7">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Ahora, tu versión
          </h2>
          <label
            htmlFor="recreate-description"
            className="mt-5 block text-sm font-semibold text-foreground"
          >
            ¿Qué quieres crear con esta referencia?
          </label>
          <textarea
            id="recreate-description"
            required
            minLength={contentType === "thumbnail" ? 3 : 10}
            maxLength={1500}
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ejemplo: una miniatura sobre cómo conseguí mis primeros 1.000 suscriptores"
            className="mt-3 w-full resize-y rounded-xl bg-background px-4 py-3 text-base leading-6 text-foreground outline-none ring-1 ring-white/10 focus:ring-brand/65"
          />
          {fieldErrors.description ? (
            <p className="mt-2 text-xs text-red-200">
              {fieldErrors.description}
            </p>
          ) : null}
          <label
            htmlFor="recreate-text"
            className="mt-5 block text-sm font-semibold text-foreground"
          >
            Texto principal{" "}
            <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="recreate-text"
            maxLength={120}
            value={primaryText}
            onChange={(event) => setPrimaryText(event.target.value)}
            placeholder="Ej. POR FIN FUNCIONÓ"
            className="mt-3 h-12 w-full rounded-xl bg-background px-4 text-base text-foreground outline-none ring-1 ring-white/10 focus:ring-brand/65"
          />
          {compatibleStyles.length ? (
            <label className="mt-5 block text-sm font-semibold text-foreground">
              Firma visual{" "}
              <span className="font-normal text-muted">(opcional)</span>
              <select
                value={brandStyleId ?? ""}
                onChange={(event) =>
                  setBrandStyleId(event.target.value || undefined)
                }
                className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-background px-3 text-base font-normal text-foreground outline-none focus:border-brand/60"
              >
                <option value="">Sin firma visual</option>
                {compatibleStyles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>

        {result.status === "error" ? (
          <div
            role="alert"
            className="mt-6 rounded-xl bg-red-950/40 px-4 py-3 text-sm text-red-100"
          >
            <strong className="block">No pudimos preparar Recreate.</strong>
            {result.message}
          </div>
        ) : null}
        <div className="mt-6 rounded-xl bg-background p-4 lg:hidden">
          <p className="text-xs font-semibold text-brand">Tu salida</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {definition.width} × {definition.height}
            {contentType !== "thumbnail"
              ? ` · ${quality === "high" ? "Alta calidad" : "Estándar"}`
              : ""}
          </p>
          <p className="mt-1 text-xs text-muted">
            {creditCost} {creditCost === 1 ? "crédito" : "créditos"}
          </p>
        </div>
        <button
          id="recreate-submit"
          type="submit"
          disabled={
            !available ||
            !hasEnoughCredits ||
            !ready ||
            result.status === "loading"
          }
          className="scroll-mt-40 mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
        >
          {result.status === "loading" ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Enviando a la cola…
            </>
          ) : (
            <>
              Recrear diseño · {creditCost}{" "}
              {creditCost === 1 ? "crédito" : "créditos"}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
        {!available ? (
          <p role="status" className="mt-3 text-center text-sm text-amber-100">
            La generación está temporalmente en mantenimiento. Tu referencia y
            tu idea permanecen en pantalla.
          </p>
        ) : !hasEnoughCredits && availableCredits !== null ? (
          <p role="status" className="mt-3 text-center text-sm text-amber-100">
            Necesitas {creditCost - availableCredits}{" "}
            {creditCost - availableCredits === 1
              ? "crédito más"
              : "créditos más"}
            .{" "}
            <Link href="/settings/billing" className="font-semibold underline">
              Ver planes
            </Link>
          </p>
        ) : !ready ? (
          <p role="status" className="mt-3 text-center text-xs text-muted">
            Añade y analiza una referencia para habilitar Recreate.
          </p>
        ) : null}
      </div>

      <aside className="sticky top-24 hidden overflow-hidden rounded-2xl bg-surface lg:block">
        <div className="p-6">
          <p className="text-xs font-semibold text-brand">Tu salida</p>
          <dl className="mt-4 divide-y divide-white/8 text-sm">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted">Pieza</dt>
              <dd className="font-semibold text-foreground">{product.label}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted">Medidas</dt>
              <dd className="font-semibold text-foreground">
                {definition.width} × {definition.height}
              </dd>
            </div>
            {contentType !== "thumbnail" ? (
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">Calidad</dt>
                <dd className="font-semibold text-foreground">
                  {quality === "high" ? "Alta" : "Estándar"}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted">Coste</dt>
              <dd className="font-bold text-brand">{creditCost} créditos</dd>
            </div>
          </dl>
        </div>
        <div className="border-t border-white/8 px-6 py-4 text-xs text-muted">
          {ready ? (
            <span className="flex items-center gap-2 text-foreground">
              <Check className="size-4 text-brand" />
              Referencia lista
            </span>
          ) : (
            "Analiza una referencia para continuar."
          )}
        </div>
      </aside>
    </form>
  );
}
