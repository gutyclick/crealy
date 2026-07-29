import type { Metadata } from "next";

import { ImageUpload } from "@/components/editing/image-upload";
import { RecentEditSessions } from "@/components/editing/recent-edit-sessions";
import { Container } from "@/components/layout/container";
import { requireUser } from "@/lib/auth/require-user";
import { listRecentEditSessions } from "@/lib/editing/get-edit-session";
import {
  getEditingServerEnv,
  isEditingAvailable,
} from "@/lib/env/server";

export const metadata: Metadata = { title: "Editar imagen" };

export default async function EditPage() {
  const user = await requireUser("/edit");
  const [sessions, archivedSessions] = await Promise.all([
    listRecentEditSessions(user.id, 8),
    listRecentEditSessions(user.id, 8, "archived"),
  ]);
  let maxFileMb = 10;
  try {
    maxFileMb = getEditingServerEnv().maxReferenceImageBytes / 1024 / 1024;
  } catch {
    // Keep the upload guidance visible while the feature is unavailable.
  }

  return (
    <main className="py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-brand">Editor conversacional</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Cambia la imagen. No empieces de cero.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">
            Sube una pieza, describe el ajuste y compara cada versión antes de
            decidir cuál conservar.
          </p>
        </div>
        <div className="mx-auto mt-9 max-w-5xl">
          <ImageUpload
            available={isEditingAvailable()}
            maxFileMb={maxFileMb}
          />
        </div>
        <RecentEditSessions sessions={sessions} />
        <RecentEditSessions
          sessions={archivedSessions}
          title="Sesiones archivadas"
          description="Consúltalas o reactívalas cuando quieras continuar."
        />
      </Container>
    </main>
  );
}
