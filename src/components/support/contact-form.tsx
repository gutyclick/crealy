"use client";

import { useState } from "react";
import { trackConversion } from "@/lib/analytics/events";

const categories = [
  ["technical", "Problema técnico"],
  ["billing", "Facturación"],
  ["account_security", "Cuenta y seguridad"],
  ["generation_editing", "Generación o edición"],
  ["suggestion", "Sugerencia"],
  ["other", "Otro"],
] as const;

export function ContactForm({
  defaultCategory = "technical",
  defaultSubject = "",
  authenticated,
}: {
  defaultCategory?: string;
  defaultSubject?: string;
  authenticated: boolean;
}) {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [reference, setReference] = useState("");

  return (
    <form
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("sending");
        const form = event.currentTarget;
        const response = await fetch("/api/support", {
          method: "POST",
          body: new FormData(form),
        }).catch(() => null);
        if (!response?.ok) {
          setStatus("error");
          return;
        }
        const data = (await response.json()) as { reference: string };
        trackConversion("support_request_created");
        setReference(data.reference);
        setStatus("success");
        form.reset();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Categoría
          <select
            name="category"
            defaultValue={
              categories.some(([value]) => value === defaultCategory)
                ? defaultCategory
                : "technical"
            }
            className="h-12 rounded-xl border border-white/12 bg-surface px-4 text-foreground outline-none focus:border-brand/60"
          >
            {categories.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {!authenticated && (
          <label className="grid gap-2 text-sm font-semibold">
            Correo para responderte
            <input
              name="email"
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              className="h-12 rounded-xl border border-white/12 bg-surface px-4 outline-none focus:border-brand/60"
            />
          </label>
        )}
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Asunto
        <input
          name="subject"
          required
          minLength={4}
          maxLength={120}
          defaultValue={defaultSubject}
          className="h-12 rounded-xl border border-white/12 bg-surface px-4 outline-none focus:border-brand/60"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Mensaje
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={4000}
          rows={8}
          placeholder="Describe qué ocurrió, qué esperabas y cualquier paso que ayude a reproducirlo. No incluyas contraseñas ni claves."
          className="resize-y rounded-xl border border-white/12 bg-surface p-4 outline-none placeholder:text-white/35 focus:border-brand/60"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        ID de operación <span className="font-normal text-muted">(opcional)</span>
        <input
          name="operationId"
          maxLength={36}
          inputMode="text"
          className="h-12 rounded-xl border border-white/12 bg-surface px-4 outline-none focus:border-brand/60"
        />
      </label>
      <label className="sr-only" aria-hidden="true">
        Sitio web
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-300">
          No pudimos enviar la solicitud. Revisa los campos e inténtalo otra vez.
        </p>
      )}
      {status === "success" && (
        <p role="status" className="rounded-xl bg-brand/[0.08] px-4 py-3 text-sm text-brand">
          Solicitud recibida. Guarda esta referencia: {reference}.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="min-h-12 justify-self-start rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink hover:bg-[var(--brand-hover)] disabled:cursor-wait disabled:opacity-60"
      >
        {status === "sending" ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
