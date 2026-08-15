import { NextResponse } from "next/server";

import { recordActivationEvent } from "@/lib/analytics/activation";
import { createClient } from "@/lib/supabase/server";

const allowed = new Set([
  "visual_signature_invited",
  "visual_signature_started",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    event?: unknown;
    generationId?: unknown;
  } | null;
  const event = typeof body?.event === "string" ? body.event : "";
  const generationId = typeof body?.generationId === "string" ? body.generationId : "";
  if (!allowed.has(event) || !/^[0-9a-f-]{36}$/i.test(generationId)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .select("id")
    .eq("id", generationId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .maybeSingle();
  if (generationError || !generation) {
    return NextResponse.json({ error: "generation_not_found" }, { status: 404 });
  }

  await recordActivationEvent({
    userId: user.id,
    type: event as
      | "visual_signature_invited"
      | "visual_signature_started",
    idempotencyKey: `activation:${event}:${generationId}`,
    properties: { generationId },
  }).catch(() => null);
  return NextResponse.json({ recorded: true });
}
