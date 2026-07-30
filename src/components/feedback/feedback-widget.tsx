"use client";

import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  return (
    <details className="group fixed right-4 bottom-4 z-40">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-white/15 bg-surface-elevated px-4 text-sm font-semibold text-foreground shadow-[0_12px_35px_rgba(0,0,0,0.35)] hover:bg-[#202119]">
        <MessageSquare className="size-4 text-brand" aria-hidden="true" />
        Enviar comentarios
      </summary>
      <form
        className="absolute right-0 bottom-[calc(100%+0.65rem)] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/12 bg-surface-elevated p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        onSubmit={async (event) => {
          event.preventDefault();
          setStatus("sending");
          const form = event.currentTarget;
          const data = new FormData(form);
          const response = await fetch("/api/feedback", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              category: data.get("category"),
              message: data.get("message"),
              pagePath: pathname,
              consentToShareContent: false,
            }),
          }).catch(() => null);
          if (!response?.ok) {
            setStatus("error");
            return;
          }
          setStatus("sent");
          form.reset();
        }}
      >
        <h2 className="text-base font-semibold">Ayúdanos a mejorar</h2>
        <p className="mt-2 text-xs leading-5 text-muted">
          No enviaremos automáticamente tu imagen, prompt ni contenido privado.
        </p>
        <label className="mt-4 grid gap-2 text-xs font-semibold">
          Tipo
          <select
            name="category"
            className="h-11 rounded-xl border border-white/12 bg-background px-3 text-sm"
          >
            <option value="broken">Algo no funciona</option>
            <option value="suggestion">Tengo una sugerencia</option>
            <option value="poor_result">El resultado no fue bueno</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label className="mt-4 grid gap-2 text-xs font-semibold">
          Comentario
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            className="resize-y rounded-xl border border-white/12 bg-background p-3 text-sm outline-none focus:border-brand/60"
          />
        </label>
        {status === "sent" && (
          <p role="status" className="mt-3 text-xs text-brand">
            Gracias. Recibimos tu comentario.
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="mt-3 text-xs text-red-300">
            No pudimos enviarlo. Inténtalo otra vez.
          </p>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-4 min-h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink disabled:opacity-60"
        >
          {status === "sending" ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </details>
  );
}

