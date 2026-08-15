import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type ActivationEventType =
  | "goal_selected"
  | "example_viewed"
  | "recommended_configuration_loaded"
  | "onboarding_completed"
  | "generation_started"
  | "first_result_downloaded"
  | "visual_signature_invited"
  | "visual_signature_started"
  | "visual_signature_saved";

export async function recordActivationEvent(input: {
  userId: string;
  type: ActivationEventType;
  idempotencyKey: string;
  properties?: Record<string, unknown>;
}) {
  const { error } = await createAdminClient().rpc("record_activation_event_internal", {
    p_user_id: input.userId,
    p_event_type: input.type,
    p_idempotency_key: input.idempotencyKey,
    p_properties: JSON.parse(JSON.stringify(input.properties ?? {})) as Json,
  });
  if (error) throw error;
}

export async function recordUserActivity(userId: string) {
  const { error } = await createAdminClient().rpc("record_user_activity_internal", {
    p_user_id: userId,
  });
  if (error) throw error;
}
