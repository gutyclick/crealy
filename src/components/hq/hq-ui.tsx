import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function HqPageHeader({ title, description, aside }: { title: string; description: string; aside?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 border-b border-white/8 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[clamp(1.8rem,4vw,2.65rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-foreground">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58 sm:text-base">{description}</p>
      </div>
      {aside}
    </header>
  );
}

export function HqMetric({ label, value, detail, tone = "neutral" }: { label: string; value: string | number; detail: string; tone?: "neutral" | "good" | "warning" | "danger" }) {
  return (
    <div className={cn("hq-metric", `hq-metric-${tone}`)}>
      <span className="text-xs font-medium text-white/52">{label}</span>
      <strong className="mt-5 block text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</strong>
      <span className="mt-2 block text-xs leading-5 text-white/46">{detail}</span>
    </div>
  );
}

export function HqStatus({ value }: { value: string }) {
  const good = ["completed", "active", "trialing", "useful", "sent", "delivered"].includes(value);
  const danger = ["failed", "not_useful", "canceled", "unpaid"].includes(value);
  const warning = ["queued", "claimed", "processing", "retry_scheduled", "past_due"].includes(value);
  return <span className={cn("hq-status", good && "hq-status-good", danger && "hq-status-danger", warning && "hq-status-warning")}>{statusLabel(value)}</span>;
}

export function HqTableRegion({ label, children }: { label: string; children: ReactNode }) {
  return <div className="hq-table-wrap" role="region" aria-label={label} tabIndex={0}>{children}</div>;
}

export function HqEmptyRow({ columns, message }: { columns: number; message: string }) {
  return <tr><td colSpan={columns}><div className="hq-empty-row">{message}</div></td></tr>;
}

export function statusLabel(value: string) {
  const labels: Record<string, string> = {
    completed: "Completado", failed: "Falló", queued: "En cola", claimed: "Asignado",
    processing: "Procesando", retry_scheduled: "Reintentando", active: "Activo",
    trialing: "Prueba", past_due: "Pago pendiente", canceled: "Cancelado", unpaid: "Impago",
    useful: "Me sirve", not_useful: "No me sirve", sent: "Enviado", delivered: "Entregado",
  };
  return labels[value] || value.replaceAll("_", " ");
}

export function shortId(value: string) { return `${value.slice(0, 8)}…`; }
export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
