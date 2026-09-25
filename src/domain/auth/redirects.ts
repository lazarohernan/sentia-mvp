import { getHomePathForMemberAccess } from "@/domain/organizations/member-access";
import type { PermissionProfile } from "@/domain/organizations/permission-profiles";
import type { MemberRole } from "@/domain/organizations/schemas";

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }

  try {
    const base = "https://perks.invalid";
    const destination = new URL(value, base);
    if (destination.origin !== base) {
      return "/dashboard";
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/dashboard";
  }
}

/** @deprecated Prefer getHomePathForMemberAccess con perfil y participación. */
export function getHomePathForRole(role: MemberRole | undefined) {
  if (role === "collaborator") {
    return "/colaborador";
  }

  return "/dashboard";
}

export function getHomePathForMembership(params: {
  role: MemberRole | undefined;
  profile: PermissionProfile | null;
  participatesInListening: boolean;
}) {
  if (!params.role) {
    return "/dashboard";
  }

  return getHomePathForMemberAccess({
    role: params.role,
    profile: params.profile,
    participatesInListening: params.participatesInListening,
  });
}

export function buildAuthCallbackUrl(siteUrl: string, nextPath: string) {
  const next = encodeURIComponent(getSafeRedirectPath(nextPath));
  return `${siteUrl}/auth/callback?next=${next}`;
}

export function buildInviteCallbackUrl(
  siteUrl: string,
  tokenHash: string,
  nextPath = "/auth/activar-cuenta",
) {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "invite",
    next: getSafeRedirectPath(nextPath),
  });

  return `${siteUrl}/auth/callback?${params.toString()}`;
}
