import "server-only";

import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/config/legal";
import { createAdminClient } from "@/lib/supabase/admin";

export type SignupConsentSource =
  | "email_signup"
  | "google_oauth"
  | "discord_oauth";

export async function recordSignupConsents({
  userId,
  marketingOptIn,
  source,
}: {
  userId: string;
  marketingOptIn: boolean;
  source: SignupConsentSource;
}) {
  const { error } = await createAdminClient().rpc(
    "record_signup_consents_internal",
    {
      p_user_id: userId,
      p_terms_version: CURRENT_TERMS_VERSION,
      p_privacy_version: CURRENT_PRIVACY_VERSION,
      p_marketing_opt_in: marketingOptIn,
      p_source: source,
    },
  );
  return !error;
}
