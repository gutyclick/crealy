"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { trackConversion } from "@/lib/analytics/events";

const useCases = [
  ["youtube_thumbnail", "Miniaturas de YouTube"],
  ["banners_covers", "Banners y portadas"],
  ["social_posts", "Posts para redes"],
  ["promotional_creatives", "Creatividades promocionales"],
  ["explore_formats", "Probar diferentes formatos"],
] as const;

const roles = [
  ["content_creator", "Creador de contenido"],
  ["youtuber", "YouTuber"],
  ["streamer", "Streamer"],
  ["community_manager", "Community manager"],
  ["entrepreneur", "Emprendedor"],
  ["agency", "Agencia"],
  ["business", "Negocio"],
  ["other", "Otro"],
] as const;

const actions = [
  ["youtube_thumbnail", "Crear una miniatura", "/create?type=youtube-thumbnail"],
  ["cover", "Crear una portada", "/create?type=social-cover"],
  ["edit", "Editar una imagen", "/edit"],
  ["tools", "Explorar herramientas", "/tools"],
] as const;

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [role, setRole] = useState<string>("");
  const [firstAction, setFirstAction] = useState("youtube_thumbnail");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  const save = async (skip = false) => {
    setStatus("saving");
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        primaryUseCases: skip ? [] : selectedUseCases,
        userRole: skip ? null : role || null,
        firstAction: skip ? "dashboard" : firstAction,
      }),
    }).catch(() => null);
    if (!response?.ok) {
      setStatus("error");
      return;
    }
    const data = (await response.json()) as { redirectTo?: string };
    if (!skip) trackConversion("onboarding_completed");
    router.replace(data.redirectTo || "/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-brand">Configura tu espacio</p>
        <button
          type="button"
          onClick={() => void save(true)}
          disabled={status === "saving"}
          className="min-h-11 px-2 text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
        >
          Omitir por ahora
        </button>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-brand transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted" aria-live="polite">
        Paso {step} de 3
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-surface p-5 sm:p-8">
        {step === 1 && (
          <fieldset>
            <legend className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
              ¿Qué quieres crear con Crealy?
            </legend>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Elige una o varias opciones. Esto solo organiza tus accesos rápidos.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {useCases.map(([value, label]) => {
                const selected = selectedUseCases.includes(value);
                return (
                  <label
                    key={value}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
                      selected
                        ? "border-brand/60 bg-brand/[0.08] text-foreground"
                        : "border-white/10 bg-white/[0.025] text-muted hover:border-white/20 hover:text-foreground",
                    )}
                  >
                    <input
                      type="checkbox"
                      value={value}
                      checked={selected}
                      onChange={() =>
                        setSelectedUseCases((current) =>
                          selected
                            ? current.filter((item) => item !== value)
                            : [...current, value],
                        )
                      }
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded border",
                        selected
                          ? "border-brand bg-brand text-brand-ink"
                          : "border-white/25",
                      )}
                    >
                      {selected && <Check className="size-3.5" />}
                    </span>
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <legend className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
              ¿Cómo describes mejor tu trabajo?
            </legend>
            <p className="mt-3 text-sm leading-6 text-muted">
              Puedes elegir la opción más cercana. No cambia tu plan ni tus créditos.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {roles.map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
                    role === value
                      ? "border-brand/60 bg-brand/[0.08] text-foreground"
                      : "border-white/10 text-muted hover:border-white/20 hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    className="size-4 accent-[var(--brand)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
              Elige tu primera acción
            </legend>
            <p className="mt-3 text-sm leading-6 text-muted">
              Te llevaremos al punto correcto sin crear nada ni consumir créditos.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {actions.map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
                    firstAction === value
                      ? "border-brand/60 bg-brand/[0.08] text-foreground"
                      : "border-white/10 text-muted hover:border-white/20 hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="first-action"
                    value={value}
                    checked={firstAction === value}
                    onChange={() => setFirstAction(value)}
                    className="size-4 accent-[var(--brand)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {status === "error" && (
          <p role="alert" className="mt-5 text-sm text-red-300">
            No pudimos guardar tus preferencias. Revisa tu conexión e inténtalo otra vez.
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={step === 1 || status === "saving"}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/12 px-5 text-sm font-semibold text-foreground hover:bg-white/[0.04] disabled:invisible"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Atrás
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(3, current + 1))}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)]"
            >
              Continuar
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void save()}
              disabled={status === "saving"}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)] disabled:cursor-wait disabled:opacity-60"
            >
              {status === "saving" ? "Guardando…" : "Ir a mi primera acción"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
