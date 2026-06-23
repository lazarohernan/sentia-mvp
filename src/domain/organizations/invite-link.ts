import type { SupabaseClient } from "@supabase/supabase-js";

import { buildAuthCallbackUrl, buildInviteCallbackUrl } from "@/domain/auth/redirects";
import type { Database } from "@/lib/supabase/database.types";

type ServiceClient = SupabaseClient<Database>;

export async function createInviteActivationLink(
  client: ServiceClient,
  params: {
    email: string;
    fullName: string;
    siteUrl: string;
  },
): Promise<{ userId: string; inviteLink: string }> {
  const { data, error } = await client.auth.admin.generateLink({
    type: "invite",
    email: params.email,
    options: {
      redirectTo: buildAuthCallbackUrl(
        params.siteUrl,
        "/auth/activar-cuenta?mode=invite",
      ),
      data: { full_name: params.fullName },
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "No se pudo generar la invitacion.");
  }

  const tokenHash = data.properties?.hashed_token;

  if (!tokenHash) {
    throw new Error("No se pudo generar el enlace de activacion.");
  }

  return {
    userId: data.user.id,
    inviteLink: buildInviteCallbackUrl(
      params.siteUrl,
      tokenHash,
      "/auth/activar-cuenta?mode=invite",
    ),
  };
}
