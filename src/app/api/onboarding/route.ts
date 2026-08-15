import { NextResponse } from "next/server";

import { getLaunchConfig } from "@/lib/launch/server";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingObjective, onboardingCreateRoute } from "@/config/onboarding";
import { recordActivationEvent } from "@/lib/analytics/activation";

const onboardingEvents = new Set([
  "goal_selected",
  "example_viewed",
  "recommended_configuration_loaded",
]);

async function authenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(request: Request) {
  const { user } = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    event?: unknown;
    objectiveId?: unknown;
  } | null;
  const event = typeof body?.event === "string" ? body.event : "";
  const objective = getOnboardingObjective(
    typeof body?.objectiveId === "string" ? body.objectiveId : null,
  );
  if (!onboardingEvents.has(event) || !objective) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }
  await recordActivationEvent({
    userId: user.id,
    type: event as "goal_selected" | "example_viewed" | "recommended_configuration_loaded",
    idempotencyKey: `onboarding:${event}:${objective.id}`,
    properties: { objectiveId: objective.id, contentType: objective.contentType },
  }).catch(() => null);
  return NextResponse.json({ recorded: true });
}

export async function POST(request: Request) {
  if (!getLaunchConfig().onboardingEnabled) {
    return NextResponse.json({ redirectTo: "/dashboard" });
  }
  const { supabase, user } = await authenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    objectiveId?: unknown;
    skip?: unknown;
  } | null;
  const skip = body?.skip === true;
  const objective = getOnboardingObjective(
    typeof body?.objectiveId === "string" ? body.objectiveId : null,
  );
  if (!skip && !objective) {
    return NextResponse.json({ error: "invalid_objective" }, { status: 400 });
  }

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    primary_use_cases: objective ? [objective.preferenceKey] : [],
    user_role: null,
    onboarding_completed_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 503 });
  }

  if (objective) {
    await recordActivationEvent({
      userId: user.id,
      type: "onboarding_completed",
      idempotencyKey: "onboarding:completed",
      properties: { objectiveId: objective.id, contentType: objective.contentType },
    }).catch(() => null);
  }

  return NextResponse.json({
    redirectTo: objective ? onboardingCreateRoute(objective) : "/dashboard",
  });
}
