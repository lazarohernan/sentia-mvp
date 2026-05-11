import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseServiceEnv } from "./env";

export function createServiceClient() {
  const { url, serviceRoleKey } = getSupabaseServiceEnv();
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
