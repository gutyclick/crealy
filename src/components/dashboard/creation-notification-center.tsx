"use client";

import { ArrowUpRight, Bell, Check, CircleAlert, Clock3, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { JobStatus, PublicJob } from "@/types/jobs";

export const CREATION_QUEUED_EVENT = "crealy:creation-queued";

export type CreationNotification = {
  jobId: string;
  generationId: string;
  label: string;
  status: JobStatus;
  createdAt: string;
  unread?: boolean;
};

type ToastState = {
  id: string;
  title: string;
  message: string;
  generationId?: string;
  tone: "queued" | "ready" | "failed";
};

const STORAGE_KEY = "crealy:creation-notifications";
const ACTIVE_STATUSES = new Set<JobStatus>(["queued", "claimed", "processing", "retry_scheduled"]);

function mergeNotifications(current: CreationNotification[], incoming: CreationNotification[]) {
  const byId = new Map(current.map((item) => [item.jobId, item]));
  for (const item of incoming) byId.set(item.jobId, { ...byId.get(item.jobId), ...item });
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
}

function statusCopy(status: JobStatus) {
  if (status === "queued") return "En cola";
  if (status === "claimed" || status === "processing") return "Creando";
  if (status === "retry_scheduled") return "Reintentando";
  if (status === "completed") return "Diseño listo";
  if (status === "failed") return "No se pudo completar";
  return "Cancelado";
}

export function CreationNotificationCenter({ initialNotifications }: { initialNotifications: CreationNotification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let stored: CreationNotification[] = [];
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as CreationNotification[];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    initializedRef.current = true;
    const timer = window.setTimeout(() => {
      setNotifications((current) => mergeNotifications(stored, current));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initializedRef.current) localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    function receiveQueued(event: Event) {
      const detail = (event as CustomEvent<CreationNotification>).detail;
      if (!detail?.jobId) return;
      setNotifications((current) => mergeNotifications(current, [{ ...detail, unread: true }]));
      setToast({ id: detail.jobId, title: "Tu diseño está en cola", message: "Puedes seguir creando. Te avisaremos cuando esté listo.", tone: "queued" });
    }
    window.addEventListener(CREATION_QUEUED_EVENT, receiveQueued);
    return () => window.removeEventListener(CREATION_QUEUED_EVENT, receiveQueued);
  }, []);

  useEffect(() => {
    const active = notifications.filter((item) => ACTIVE_STATUSES.has(item.status));
    if (!active.length) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const updates = await Promise.all(active.map(async (item) => {
        try {
          const response = await fetch(`/api/jobs/${item.jobId}`, { cache: "no-store" });
          return response.ok ? (await response.json()) as PublicJob : null;
        } catch {
          return null;
        }
      }));
      if (cancelled) return;
      setNotifications((current) => current.map((item) => {
        const update = updates.find((candidate) => candidate?.id === item.jobId);
        if (!update || update.status === item.status) return item;
        const becameReady = update.status === "completed";
        const becameFailed = update.status === "failed" || update.status === "cancelled";
        if (becameReady) {
          setToast({ id: `${item.jobId}-ready`, title: "Tu diseño está listo", message: item.label, generationId: item.generationId, tone: "ready" });
        } else if (becameFailed) {
          setToast({ id: `${item.jobId}-failed`, title: "La creación no se completó", message: "Liberamos los créditos reservados. Puedes intentarlo otra vez.", tone: "failed" });
        }
        return { ...item, status: update.status, unread: becameReady || becameFailed };
      }));
    }, 2_400);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [notifications]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 7_500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const attentionCount = useMemo(() => notifications.filter((item) => ACTIVE_STATUSES.has(item.status) || item.unread).length, [notifications]);

  function toggle() {
    setOpen((current) => !current);
    setNotifications((current) => current.map((item) => ACTIVE_STATUSES.has(item.status) ? item : { ...item, unread: false }));
  }

  function dismiss(jobId: string) {
    setNotifications((current) => current.filter((item) => item.jobId !== jobId));
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <button type="button" aria-label={attentionCount ? `Actividad de creación, ${attentionCount} pendiente` : "Actividad de creación"} aria-expanded={open} aria-controls="creation-notifications" onClick={toggle} className="relative grid size-11 place-items-center rounded-[0.7rem] text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground">
          <Bell aria-hidden="true" className="size-5" />
          {attentionCount ? <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.625rem] font-bold leading-4 text-brand-ink">{Math.min(attentionCount, 9)}</span> : null}
        </button>

        {open ? (
          <div id="creation-notifications" className="absolute right-0 top-[calc(100%+0.65rem)] z-30 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-[0.9rem] border border-white/10 bg-surface-elevated shadow-[0_24px_65px_rgba(0,0,0,.5)]">
            <div className="border-b border-white/[0.08] px-4 py-3.5">
              <p className="text-sm font-semibold text-foreground">Actividad de creación</p>
              <p className="mt-0.5 text-xs text-muted">Tus diseños continúan aunque cambies de página.</p>
            </div>
            {notifications.length ? (
              <div className="max-h-[25rem] overflow-y-auto p-2">
                {notifications.map((item) => {
                  const active = ACTIVE_STATUSES.has(item.status);
                  const ready = item.status === "completed";
                  const failed = item.status === "failed" || item.status === "cancelled";
                  const Icon = active ? LoaderCircle : ready ? Check : CircleAlert;
                  return (
                    <div key={item.jobId} className="group flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.04]">
                      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${ready ? "bg-brand text-brand-ink" : failed ? "bg-red-400/10 text-red-200" : "bg-brand/10 text-brand"}`}>
                        <Icon aria-hidden="true" className={`size-4 ${active ? "animate-spin" : ""}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                        <p className={`mt-1 text-xs ${ready ? "text-brand" : "text-muted"}`}>{statusCopy(item.status)}</p>
                        {ready ? <Link onClick={() => setOpen(false)} href={`/generations/${item.generationId}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-brand">Ver diseño <ArrowUpRight aria-hidden="true" className="size-3.5" /></Link> : null}
                      </div>
                      {!active ? <button type="button" onClick={() => dismiss(item.jobId)} aria-label={`Quitar ${item.label}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-white/35 opacity-0 hover:bg-white/[0.06] hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"><X aria-hidden="true" className="size-4" /></button> : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <Clock3 aria-hidden="true" className="mx-auto size-5 text-white/30" />
                <p className="mt-3 text-sm font-medium text-foreground">Todo al día</p>
                <p className="mt-1 text-xs text-muted">Aquí aparecerán tus próximas creaciones.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {toast && typeof document !== "undefined" ? createPortal((
        <div key={toast.id} role="status" aria-live="polite" className="creation-toast fixed bottom-5 right-4 z-[70] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-surface-elevated p-4 shadow-[0_24px_70px_rgba(0,0,0,.55)] sm:bottom-6 sm:right-6">
          <div className="flex items-start gap-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toast.tone === "ready" ? "bg-brand text-brand-ink" : toast.tone === "failed" ? "bg-red-400/10 text-red-200" : "bg-brand/10 text-brand"}`}>
              {toast.tone === "ready" ? <Check className="size-5" /> : toast.tone === "failed" ? <CircleAlert className="size-5" /> : <Clock3 className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{toast.message}</p>
              {toast.generationId ? <Link href={`/generations/${toast.generationId}`} onClick={() => setToast(null)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">Ver resultado <ArrowUpRight aria-hidden="true" className="size-3.5" /></Link> : null}
            </div>
            <button type="button" onClick={() => setToast(null)} aria-label="Cerrar notificación" className="grid size-8 place-items-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-foreground"><X aria-hidden="true" className="size-4" /></button>
          </div>
        </div>
      ), document.body) : null}
    </>
  );
}
