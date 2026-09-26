import type { User } from "@supabase/supabase-js";

export function needsOwnerOnboarding(user: User) {
  return user.app_metadata?.perks_owner_onboarding === true;
}
