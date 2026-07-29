"use client";

import {
  ArrowRight,
  Download,
  Image as ImageIcon,
  LoaderCircle,
  MonitorPlay,
  PanelsTopLeft,
  Plus,
  RectangleHorizontal,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  ReferenceImagePicker,
  type ReferenceDraft,
} from "@/components/generation/reference-image-picker";
import {
  DEFAULT_GENERATION_VALUES,
  GENERATION_COLORS,
  GENERATION_CONTENT_TYPES,
  GENERATION_FORMATS,
  GENERATION_QUALITIES,
  GENERATION_STYLES,
  getContentTypeConfig,
  getFormatConfig,
  requiresHighQuality,
} from "@/config/generation";
import { cn } from "@/lib/utils";
import { readApiResponse } from "@/lib/uploads/read-api-response";
import { uploadPrivateImage } from "@/lib/uploads/upload-private-image";
import type {
  ColorPreference,
  ContentType,
  GenerationErrorResponse,
  GenerationFormat,
  GenerationQuality,
  GenerationResponse,
  GenerationStyle,
} from "@/types/generation";
import type { QueuedGenerationResponse } from "@/types/jobs";

const contentIcons = {
  "monitor-play": MonitorPlay,
  image: ImageIcon,
  "rectangle-horizontal": RectangleHorizontal,
  "panels-top-left": PanelsTopLeft,
} as const;

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "completed" } & GenerationResponse);

export function GenerationForm({
  available,
  maxReferenceFileMb,
}: {
  available: boolean;
  maxReferenceFileMb: number;
}) {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>(
    DEFAULT_GENERATION_VALUES.contentType,
  );
  const [format, setFormat] = useState<GenerationFormat>(
    DEFAULT_GENERATION_VALUES.format,
  );
  const [description, setDescription] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [style, setStyle] = useState<GenerationStyle>(
    DEFAULT_GENERATION_VALUES.style,
  );
  const [colorPreference, setColorPreference] = useState<ColorPreference>(
    DEFAULT_GENERATION_VALUES.colorPreference,
  );
  const [customColors, setCustomColors] = useState(["#DDF527", "#10110D"]);
  const [quality, setQuality] = useState<GenerationQuality>(
    DEFAULT_GENERATION_VALUES.quality,
  );
  const [projectId, setProjectId] = useState<string>();
  const [result, setResult] = useState<ResultState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<ReferenceDraft[]>([]);
  const referencesRef = useRef(references);

  useEffect(() => {
    referencesRef.current = references;
  }, [references]);

  useEffect(() => {
    return () => {
      referencesRef.current.forEach((reference) =>
        URL.revokeObjectURL(reference.previewUrl),
      );
    };
  }, []);

  const currentType = getContentTypeConfig(contentType);
  const compatibleFormats = useMemo(
    () =>
      GENERATION_FORMATS.filter(
        (item) =>
          !("legacy" in item && item.legacy) &&
          currentType.formats.some((formatId) => formatId === item.id),
      ),
    [currentType],
  );
  const currentFormat = getFormatConfig(format);
  const highQualityRequired = requiresHighQuality(format);
  const aspectRatio =
    format === "youtube-16-9"
      ? "16 / 9"
      : format === "social-square"
        ? "1 / 1"
        : format === "social-portrait"
          ? "4 / 5"
          : format === "banner-3-1" || format === "x-cover"
            ? "3 / 1"
            : format === "facebook-cover"
              ? "851 / 315"
              : format === "linkedin-cover"
                ? "4 / 1"
                : "12 / 5";

  function selectContentType(nextType: ContentType) {
    const config = getContentTypeConfig(nextType);
    setContentType(nextType);
    setFormat(config.formats[0]);
    setQuality(requiresHighQuality(config.formats[0]) ? "high" : "fast");
    setProjectId(undefined);
    if (result.status === "completed") setResult({ status: "idle" });
    setFieldErrors({});
  }

  async function submitGeneration(event?: FormEvent) {
    event?.preventDefault();
    if (!available || result.status === "loading") return;

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
            const upload = await uploadPrivateImage(reference.file, "reference");
            setReferences((current) =>
              current.map((item) =>
                item.key === reference.key
                  ? {
                      ...item,
                      uploadId: upload.uploadId,
                      status: "uploaded",
                    }
                  : item,
              ),
            );
            return upload.uploadId;
          } catch (uploadError) {
            setReferences((current) =>
              current.map((item) =>
                item.key === reference.key
                  ? { ...item, status: "error" }
                  : item,
              ),
            );
            throw uploadError;
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
          description,
          primaryText: primaryText.trim() || undefined,
          style,
          colorPreference,
          customColors:
            colorPreference === "custom" ? customColors : undefined,
          format,
          quality,
          referenceUploadIds:
            referenceUploadIds.length > 0 ? referenceUploadIds : undefined,
        }),
      });
      const payload = await readApiResponse<
        | QueuedGenerationResponse
        | GenerationErrorResponse
      >(response, "No pudimos completar la generación.");

      if (!response.ok || "error" in payload) {
        if ("fields" in payload && payload.fields) {
          setFieldErrors(payload.fields);
        }
        throw new Error(
          "error" in payload
            ? payload.error
            : "No pudimos completar la generación.",
        );
      }

      setProjectId(payload.projectId);
      router.push(`/generations/${payload.generationId}?job=${payload.jobId}`);
    } catch (error) {
      setResult({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos completar la generación.",
      });
    }
  }

  function resetCreation() {
    references.forEach((reference) =>
      URL.revokeObjectURL(reference.previewUrl),
    );
    setReferences([]);
    setProjectId(undefined);
    setDescription("");
    setPrimaryText("");
    setResult({ status: "idle" });
    setFieldErrors({});
  }

  return (
    <form
      onSubmit={submitGeneration}
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(30rem,1.12fr)]"
    >
      <div
        inert={result.status === "loading"}
        aria-disabled={result.status === "loading"}
        className="rounded-2xl border border-white/10 bg-surface p-5 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand">Nuevo diseño</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-foreground">
              Dale forma a tu idea.
            </h1>
          </div>
          <Sparkles aria-hidden="true" className="mt-1 size-5 text-brand" />
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          Define lo esencial. Crealy se encarga de convertirlo en una pieza
          lista para trabajar.
        </p>

        <fieldset className="mt-8">
          <legend className="text-sm font-semibold text-foreground">
            ¿Qué quieres crear?
          </legend>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {GENERATION_CONTENT_TYPES.filter(
              (item) => !("legacy" in item && item.legacy),
            ).map((item) => {
              const Icon = contentIcons[item.icon];
              const selected = contentType === item.id;
              return (
                <label
                  key={item.id}
                  className={cn(
                    "group cursor-pointer rounded-xl border p-3.5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                    selected
                      ? "border-brand/70 bg-brand/[0.06]"
                      : "border-white/10 bg-background hover:border-white/20",
                  )}
                >
                  <input
                    type="radio"
                    name="contentType"
                    value={item.id}
                    checked={selected}
                    onChange={() => selectContentType(item.id)}
                    className="sr-only"
                  />
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-4.5",
                      selected ? "text-brand" : "text-white/55",
                    )}
                  />
                  <span className="mt-4 block text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="mt-1 hidden text-xs leading-5 text-muted sm:block">
                    {item.description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">
            Elige el tamaño
          </legend>
          <p className="mt-1 text-xs leading-5 text-muted">
            Mostramos únicamente los tamaños compatibles con la categoría seleccionada.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {compatibleFormats.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                  format === item.id
                    ? "border-brand/65 bg-brand/[0.07] text-brand"
                    : "border-white/12 text-muted hover:border-white/25 hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="format"
                  value={item.id}
                  checked={format === item.id}
                  onChange={() => {
                    setFormat(item.id);
                    if (requiresHighQuality(item.id)) setQuality("high");
                  }}
                  className="sr-only"
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-7">
          <label
            htmlFor="description"
            className="text-sm font-semibold text-foreground"
          >
            Describe lo que quieres crear
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            maxLength={1500}
            required
            rows={5}
            placeholder={currentType.example}
            aria-describedby={
              fieldErrors.description ? "description-error" : "description-hint"
            }
            className="mt-3 w-full resize-y rounded-xl border border-white/12 bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-white/35 focus:border-brand/65"
          />
          <div className="mt-2 flex items-start justify-between gap-4 text-xs">
            <p
              id={fieldErrors.description ? "description-error" : "description-hint"}
              className={fieldErrors.description ? "text-red-300" : "text-muted"}
            >
              {fieldErrors.description ||
                "Incluye el tema, el tono y aquello que debe destacar."}
            </p>
            <span className="shrink-0 text-white/45">{description.length}/1500</span>
          </div>
        </div>

        <ReferenceImagePicker
          references={references}
          setReferences={setReferences}
          maxFileMb={maxReferenceFileMb}
          disabled={result.status === "loading"}
        />

        <div className="mt-6">
          <label
            htmlFor="primaryText"
            className="text-sm font-semibold text-foreground"
          >
            Texto principal{" "}
            <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="primaryText"
            value={primaryText}
            onChange={(event) => setPrimaryText(event.target.value)}
            maxLength={120}
            placeholder="Ej. Crea más. Publica mejor."
            className="mt-3 h-12 w-full rounded-xl border border-white/12 bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-white/35 focus:border-brand/65"
          />
          <p className="mt-2 text-xs leading-5 text-muted">
            La IA intentará respetarlo, aunque puede presentar pequeñas
            variaciones tipográficas.
          </p>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">
            Estilo visual
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GENERATION_STYLES.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-xl border has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                  style === item.id
                    ? "border-brand/70"
                    : "border-white/10 hover:border-white/25",
                )}
              >
                <input
                  type="radio"
                  name="style"
                  value={item.id}
                  checked={style === item.id}
                  onChange={() => setStyle(item.id)}
                  className="sr-only"
                />
                {/* Static references let the user understand the direction before spending credits. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.example}
                  alt=""
                  className="aspect-[16/10] w-full object-cover opacity-70 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-90"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 text-xs font-semibold text-white">
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <label className="text-sm font-semibold text-foreground">
            Color
            <select
              value={colorPreference}
              onChange={(event) =>
                setColorPreference(event.target.value as ColorPreference)
              }
              className="mt-3 h-12 w-full rounded-xl border border-white/12 bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-brand/65"
            >
              {GENERATION_COLORS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {colorPreference === "custom" ? (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {customColors.map((color, index) => (
                <div
                  key={`${index}-${color}`}
                  className="flex h-12 items-center gap-2 rounded-xl border border-white/12 bg-background px-3 text-xs font-medium text-muted"
                >
                  <input
                    type="color"
                    aria-label={`Color personalizado ${index + 1}`}
                    value={color}
                    onChange={(event) =>
                      setCustomColors((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item,
                        ),
                      )
                    }
                    className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="min-w-0 flex-1 truncate">{color.toUpperCase()}</span>
                  {customColors.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Quitar color ${index + 1}`}
                      onClick={() =>
                        setCustomColors((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="grid size-7 place-items-center rounded-lg hover:bg-white/[0.07] hover:text-foreground"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {customColors.length < 5 ? (
              <button
                type="button"
                onClick={() => setCustomColors((current) => [...current, "#FFFFFF"])}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/12 px-3 text-xs font-semibold text-muted hover:border-white/25 hover:text-foreground"
              >
                <Plus aria-hidden="true" className="size-4" />
                Añadir color ({customColors.length}/5)
              </button>
            ) : (
              <p className="mt-3 text-xs text-muted">Paleta completa · 5 colores</p>
            )}
          </div>
        ) : null}

        {highQualityRequired ? (
          <div className="mt-6 rounded-xl border border-brand/25 bg-brand/[0.055] px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Alta calidad incluida</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Las miniaturas y portadas se generan siempre en alta calidad para conservar detalle y texto.
            </p>
          </div>
        ) : (
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">
            Calidad
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {GENERATION_QUALITIES.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "cursor-pointer rounded-xl border p-3.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                  quality === item.id
                    ? "border-brand/65 bg-brand/[0.06]"
                    : "border-white/12 bg-background",
                )}
              >
                <input
                  type="radio"
                  name="quality"
                  value={item.id}
                  checked={quality === item.id}
                  onChange={() => setQuality(item.id)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-foreground">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {item.description}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        )}

        <button
          type="submit"
          disabled={!available || result.status === "loading"}
          className={cn(
            "mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45",
            result.status === "completed"
              ? "border-white/14 bg-white/[0.035] text-foreground hover:bg-white/[0.07]"
              : "border-transparent bg-brand text-brand-ink shadow-[0_14px_38px_rgba(221,245,39,0.12)] hover:bg-[var(--brand-hover)]",
          )}
        >
          {result.status === "loading" ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Creando tu imagen…
            </>
          ) : (
            <>
              {result.status === "completed"
                ? "Aplicar cambios y generar"
                : "Generar imagen"}
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
        </button>
        {!available ? (
          <p className="mt-3 text-center text-xs leading-5 text-amber-200">
            La generación no está disponible en este momento. Inténtalo de
            nuevo más tarde.
          </p>
        ) : null}
      </div>

      <section
        aria-label="Resultado de la generación"
        aria-live="polite"
        className="lg:sticky lg:top-6"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d0a] p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Tu resultado
              </h2>
              <p className="mt-1 text-xs text-muted">
                {currentType.fullLabel} · {currentFormat.shortLabel}
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-muted">
              {quality === "fast" ? "Borrador rápido" : "Alta calidad"}
            </span>
          </div>

          <div
            style={{ aspectRatio }}
            className={cn(
              "relative grid max-h-[70vh] w-full place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-surface",
              result.status === "completed" ? "" : "min-h-64",
            )}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(221,245,39,0.07),transparent_45%)]"
            />
            {result.status === "completed" ? (
              // Signed Supabase URLs vary by project, so this remains a native image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.imageUrl}
                alt={`Diseño generado: ${description}`}
                className="relative size-full object-contain"
              />
            ) : result.status === "loading" ? (
              <div className="relative max-w-sm px-8 text-center">
                <div className="generation-orbit mx-auto grid size-16 place-items-center rounded-2xl border border-brand/25 bg-brand/[0.06]">
                  <Sparkles aria-hidden="true" className="size-6 text-brand" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">
                  Estamos dando forma a tu idea.
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  La imagen puede tardar hasta un par de minutos. Puedes dejar
                  esta pestaña abierta.
                </p>
              </div>
            ) : (
              <div className="relative max-w-sm px-8 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.035]">
                  <ImageIcon aria-hidden="true" className="size-5 text-white/45" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {result.status === "error"
                    ? "La imagen no pudo generarse."
                    : "Tu próxima pieza empieza aquí."}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-6",
                    result.status === "error" ? "text-red-200" : "text-muted",
                  )}
                >
                  {result.status === "error"
                    ? result.message
                    : "Completa el brief y verás el resultado en este lienzo."}
                </p>
              </div>
            )}
          </div>

          {result.status === "completed" ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href={`/api/generations/${result.generationId}/download`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink transition-colors hover:bg-[var(--brand-hover)]"
              >
                <Download aria-hidden="true" className="size-4" />
                Descargar PNG
              </a>
              <button
                type="button"
                onClick={() => submitGeneration()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/14 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.05]"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Generar otra versión
              </button>
              <Link
                href={`/generations/${result.generationId}`}
                className="inline-flex min-h-10 items-center justify-center text-sm font-medium text-muted hover:text-foreground sm:col-span-1"
              >
                Ver detalle
              </Link>
              <button
                type="button"
                onClick={resetCreation}
                className="min-h-10 text-sm font-medium text-muted hover:text-foreground"
              >
                Crear algo nuevo
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </form>
  );
}
