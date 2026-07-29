import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (adminClient) return adminClient;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error(
      "[Crealy] Falta SUPABASE_SERVICE_ROLE_KEY para operaciones internas.",
    );
  }

  const { url } = getSupabaseEnv();
  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return adminClient;
}
