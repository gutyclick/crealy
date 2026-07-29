import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditWorkspace } from "@/components/editing/edit-workspace";
import { requireUser } from "@/lib/auth/require-user";
import { getEditSession } from "@/lib/editing/get-edit-session";
import { isEditingAvailable } from "@/lib/env/server";

/*
THESIS: La imagen manda; la conversación existe para cambiarla sin convertir el trabajo en un panel técnico.
OWN-WORLD: estudio mate negro, lienzo profundo y lima #DDF527 reservada para decisiones activas y progreso.
STORY: observar, pedir un ajuste, recibir una versión, comparar y elegir la nueva base sin perder el historial.
FIRST VIEWPORT: lienzo amplio a la izquierda, conversación accionable a la derecha y versiones visibles debajo.
FORM: composición A elegida entre tres exploraciones; staging de lienzo + conversación, derivado del brief fijo.
*/

export const metadata: Metadata = { title: "Editor conversacional" };

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser("/edit");
  const { sessionId } = await params;
  const session = await getEditSession(user.id, sessionId);
  if (!session || !session.versions.length) notFound();

  return (
    <EditWorkspace
      initialSession={session}
      available={isEditingAvailable()}
    />
  );
}
