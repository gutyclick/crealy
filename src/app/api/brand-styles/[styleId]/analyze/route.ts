import { NextResponse } from "next/server";

import { recordActivationEvent } from "@/lib/analytics/activation";
import { analyzeBrandStyle } from "@/lib/brand-styles/analyze-style";
import { getBrandStyleAccess, requireOwnedStyle } from "@/lib/brand-styles/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_: Request, { params }: { params: Promise<{ styleId: string }> }) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const id = (await params).styleId;

  try {
    await requireOwnedStyle(user.id, id);
    const { entitlement } = await getBrandStyleAccess(user.id);
    if (!entitlement.enabled) {
      return NextResponse.json(
        { error: "Esta función requiere un plan compatible." },
        { status: 403 },
      );
    }
    const analysis = await analyzeBrandStyle(user.id, id);
    await recordActivationEvent({
      userId: user.id,
      type: "visual_signature_saved",
      idempotencyKey: `visual-signature:saved:${id}`,
      properties: { styleId: id },
    }).catch(() => null);
    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "insufficient_style_references"
            ? "Añade al menos tres referencias."
            : "No pudimos analizar las referencias. Inténtalo de nuevo.",
      },
      { status: 400 },
    );
  }
}
