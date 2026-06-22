import type { MemberRole } from "@/domain/organizations/schemas";

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function getHomePathForRole(role: MemberRole | undefined) {
  if (role === "collaborator") {
    return "/colaborador";
  }

  return "/dashboard";
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
