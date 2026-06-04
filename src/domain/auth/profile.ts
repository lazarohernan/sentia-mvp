import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type UserProfile = {
  fullName: string;
};

export function getUserInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export async function getUserProfileById(
  client: Client,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { full_name: string | null };

  return {
    fullName: row.full_name?.trim() || "Usuario",
  };
}
