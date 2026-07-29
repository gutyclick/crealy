import type { Metadata } from "next";
import { Download, HardDrive, Pin, PinOff, Trash2 } from "lucide-react";

import {
  expireAsset,
  pinAsset,
  unpinAsset,
} from "@/app/(dashboard)/settings/storage/actions";
import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";
import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Archivos y almacenamiento | Crealy" };

function bytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(0, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

async function currentTimestamp() {
  return Date.now();
}

export default async function StoragePage() {
  const user = await requireUser("/settings/storage");
  const supabase = await createClient();
  const [assetsResult, billing] = await Promise.all([
    supabase
      .from("assets")
      .select("id, kind, mime_type, file_size_bytes, status, expires_at, pinned_at, created_at")
      .eq("user_id", user.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(20),
    getUserBillingState(user.id),
  ]);
  const assets = assetsResult.data ?? [];
  const renderedAt = await currentTimestamp();
  const used = assets.filter((item) => item.status === "active").reduce((sum, item) => sum + item.file_size_bytes, 0);
  const quotaMb = Number(billing.effectivePlan.key === "free" ? process.env.FREE_STORAGE_LIMIT_MB || 250 : process.env.PRO_STORAGE_LIMIT_MB || 2048);
  const quota = quotaMb * 1024 * 1024;
  const pinned = assets.filter((item) => item.pinned_at).length;
  const temporary = assets.filter((item) => item.kind === "temporary_processing" || item.kind === "user_upload").length;
  const soon = assets.filter((item) => item.expires_at && new Date(item.expires_at).getTime() - renderedAt < 7 * 86_400_000).length;

  return (
    <main className="py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium text-brand">Archivos privados</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Archivos y almacenamiento</h1>
          <p className="mt-4 text-base leading-7 text-muted">Los originales son privados, usan acceso firmado y caducan según tu plan. Conserva solo lo que necesitas.</p>
          <section className="mt-10 border-y border-white/10 py-8">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-xl bg-brand/10 text-brand"><HardDrive aria-hidden="true" className="size-5" /></span>
              <div>
                <p className="text-2xl font-semibold">{bytes(used)} <span className="text-base font-normal text-muted">de {bytes(quota)}</span></p>
                <p className="mt-1 text-sm text-muted">{pinned} fijados · {temporary} temporales · {soon} próximos a expirar</p>
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (used / quota) * 100)}%` }} />
            </div>
          </section>
          <section className="mt-8" aria-labelledby="files-title">
            <h2 id="files-title" className="text-xl font-semibold">Archivos recientes</h2>
            {assets.length ? (
              <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {assets.map((asset) => {
                  const expiry = asset.expires_at ? new Date(asset.expires_at) : null;
                  const days = expiry ? Math.max(0, Math.ceil((expiry.getTime() - renderedAt) / 86_400_000)) : null;
                  return (
                    <div key={asset.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{asset.kind.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-xs text-muted">{bytes(asset.file_size_bytes)} · {asset.pinned_at ? "Conservado" : expiry ? `Disponible hasta el ${expiry.toLocaleDateString("es")}` : asset.status}</p>
                        {days !== null && days <= 7 ? <p className="mt-1 text-xs text-amber-200">Este archivo se eliminará en {days} días.</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {asset.status === "active" ? <a href={`/api/assets/${asset.id}/download`} className="grid size-10 place-items-center rounded-lg border border-white/12" aria-label="Descargar"><Download className="size-4" /></a> : null}
                        <form action={asset.pinned_at ? unpinAsset : pinAsset}><input type="hidden" name="assetId" value={asset.id} /><button className="grid size-10 place-items-center rounded-lg border border-white/12" aria-label={asset.pinned_at ? "Liberar espacio" : "Conservar"}>{asset.pinned_at ? <PinOff className="size-4" /> : <Pin className="size-4" />}</button></form>
                        <form action={expireAsset}><input type="hidden" name="assetId" value={asset.id} /><button className="grid size-10 place-items-center rounded-lg border border-red-300/20 text-red-200" aria-label="Eliminar de forma segura"><Trash2 className="size-4" /></button></form>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="mt-4 border-y border-white/10 py-6 text-sm text-muted">Todavía no hay archivos administrables.</p>}
          </section>
        </div>
      </Container>
    </main>
  );
}
