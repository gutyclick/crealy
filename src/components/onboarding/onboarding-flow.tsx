"use client";

import { ArrowLeft, ArrowRight, Check, Download, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ONBOARDING_OBJECTIVES, onboardingCreateRoute } from "@/config/onboarding";
import { trackConversion } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type Status = "idle" | "saving" | "error";

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [objectiveId, setObjectiveId] = useState(ONBOARDING_OBJECTIVES[0].id);
  const [status, setStatus] = useState<Status>("idle");
  const objective = ONBOARDING_OBJECTIVES.find((item) => item.id === objectiveId)!;

  const recordStep = (event: string) => {
    void fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, objectiveId }),
      keepalive: true,
    });
  };

  const continueFlow = () => {
    if (step === 1) recordStep("goal_selected");
    if (step === 2) {
      recordStep("example_viewed");
      recordStep("recommended_configuration_loaded");
    }
    setStep((current) => Math.min(3, current + 1));
  };

  const save = async (skip = false) => {
    setStatus("saving");
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ objectiveId: skip ? null : objectiveId, skip }),
    }).catch(() => null);
    if (!response?.ok) {
      setStatus("error");
      return;
    }
    const data = (await response.json()) as { redirectTo?: string };
    if (!skip) trackConversion("onboarding_completed");
    router.replace(data.redirectTo || (skip ? "/dashboard" : onboardingCreateRoute(objective)));
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted" aria-live="polite">
          Paso <span className="font-semibold text-foreground">{step}</span> de 3
        </p>
        <button type="button" onClick={() => void save(true)} disabled={status === "saving"} className="min-h-11 px-2 text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50">
          Explorar por mi cuenta
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <span key={item} className={cn("h-1 rounded-full transition-colors duration-200", item <= step ? "bg-brand" : "bg-white/10")} />
        ))}
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl bg-surface shadow-[0_28px_90px_rgba(0,0,0,.28)] ring-1 ring-white/10">
        {step === 1 ? (
          <div className="px-5 py-8 sm:px-9 sm:py-10">
            <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">¿Qué quieres conseguir primero?</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Elige un objetivo. Crealy preparará un ejemplo y una configuración útil para que no empieces desde cero.</p>
            <fieldset className="mt-8 grid gap-3 md:grid-cols-2">
              <legend className="sr-only">Objetivo de tu primera creación</legend>
              {ONBOARDING_OBJECTIVES.map((item) => {
                const selected = item.id === objectiveId;
                return (
                  <label key={item.id} className={cn("group flex min-h-28 cursor-pointer items-start gap-4 rounded-xl px-4 py-4 text-left ring-1 transition-[background-color,box-shadow] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand", selected ? "bg-brand/[0.08] ring-brand/55" : "bg-background/55 ring-white/10 hover:ring-white/20")}>
                    <input type="radio" name="objective" value={item.id} checked={selected} onChange={() => setObjectiveId(item.id)} className="sr-only" />
                    <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg", selected ? "bg-brand text-brand-ink" : "bg-white/[0.06] text-muted")}>
                      {selected ? <Check className="size-4" /> : <Target className="size-4" />}
                    </span>
                    <span>
                      <strong className="block text-base font-semibold text-foreground">{item.label}</strong>
                      <span className="mt-1.5 block text-sm leading-6 text-muted">{item.description}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]">
            <div className="relative min-h-72 overflow-hidden bg-background lg:min-h-[34rem]">
              <Image src={objective.exampleImage} alt={objective.exampleAlt} fill priority sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-5 rounded-lg bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">Ejemplo de dirección visual · editable antes de generar</p>
            </div>
            <div className="flex flex-col justify-center px-6 py-8 sm:px-9 lg:py-10">
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">Un punto de partida, no una plantilla rígida.</h1>
              <p className="mt-4 text-sm leading-6 text-muted">Precargaremos una idea relevante. Podrás reescribirla, cambiar el estilo o añadir referencias antes de usar créditos.</p>
              <dl className="mt-7 divide-y divide-white/10 border-y border-white/10 text-sm">
                <div className="flex items-center justify-between gap-4 py-4"><dt className="text-muted">Formato</dt><dd className="font-semibold text-foreground">{objective.contentType === "thumbnail" ? "Miniatura 16:9" : objective.contentType === "profile-image" ? "Perfil 1:1" : "Post 1:1"}</dd></div>
                <div className="flex items-center justify-between gap-4 py-4"><dt className="text-muted">Dirección</dt><dd className="font-semibold text-foreground">{objective.recommendedStyleLabel}</dd></div>
                <div className="flex items-center justify-between gap-4 py-4"><dt className="text-muted">Coste inicial</dt><dd className="font-semibold text-foreground">1 crédito</dd></div>
              </dl>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="px-5 py-9 sm:px-9 sm:py-12">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-xl bg-brand text-brand-ink shadow-[0_14px_40px_rgba(221,245,39,.14)]"><Sparkles className="size-6" /></span>
              <h1 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">Tu primera creación ya tiene dirección.</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">Abriremos el editor con una idea preparada para {objective.label.toLowerCase()}. Revísala, genera y descarga tu primer resultado.</p>
            </div>
            <div className="mx-auto mt-9 grid max-w-3xl gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-3">
              {[
                [Check, "Configuración lista", "Brief y estilo precargados"],
                [Sparkles, "Genera de verdad", "Puedes ajustar todo antes"],
                [Download, "Primera victoria", "Descarga y guarda tu resultado"],
              ].map(([Icon, title, copy]) => (
                <div key={String(title)} className="bg-background px-5 py-5">
                  <Icon className="size-4 text-brand" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-foreground">{String(title)}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{String(copy)}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-5 text-muted">Después de descargar, te mostraremos cómo guardar una Firma Visual para mantener consistencia en las próximas piezas.</p>
          </div>
        ) : null}

        {status === "error" ? <p role="alert" className="mx-5 mb-5 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-300/20 sm:mx-9">No pudimos guardar tu avance. Revisa tu conexión e inténtalo otra vez.</p> : null}

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-9">
          <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || status === "saving"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:invisible"><ArrowLeft className="size-4" aria-hidden="true" />Atrás</button>
          {step < 3 ? (
            <button type="button" onClick={continueFlow} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{step === 1 ? "Ver mi punto de partida" : "Usar esta dirección"}<ArrowRight className="size-4" aria-hidden="true" /></button>
          ) : (
            <button type="button" onClick={() => void save()} disabled={status === "saving"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60">{status === "saving" ? "Preparando…" : "Abrir mi primera creación"}<ArrowRight className="size-4" aria-hidden="true" /></button>
          )}
        </div>
      </section>
    </div>
  );
}
