import type { Metadata } from "next";
import { HardDrive } from "lucide-react";

import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Almacenamiento | Crealy" };

function bytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(0, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default async function StoragePage() {
  const user = await requireUser("/settings/storage");
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_uploads")
    .select("file_size, expires_at")
    .eq("user_id", user.id);
  const used = (data ?? []).reduce((sum, item) => sum + item.file_size, 0);
  const quota = Number(process.env.UPLOAD_MAX_TOTAL_MB_PER_USER || 500) * 1024 * 1024;
  const temporary = (data ?? []).filter((item) => item.expires_at).length;
  const percent = Math.min(100, (used / quota) * 100);

  return (
    <main className="py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-brand">Archivos privados</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Almacenamiento</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Las referencias temporales caducan a los 30 días. Los resultados y las fuentes de ediciones activas se conservan.
          </p>
          <section className="mt-10 border-y border-white/10 py-8">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-xl bg-brand/10 text-brand"><HardDrive aria-hidden="true" className="size-5" /></span>
              <div>
                <p className="text-2xl font-semibold">{bytes(used)} <span className="text-base font-normal text-muted">de {bytes(quota)}</span></p>
                <p className="mt-1 text-sm text-muted">{data?.length ?? 0} archivos · {temporary} temporales</p>
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">
              El almacenamiento se sirve mediante una capa privada compatible con Supabase Storage y Cloudflare R2. Las descargas usan enlaces firmados de corta duración.
            </p>
          </section>
        </div>
      </Container>
    </main>
  );
}
