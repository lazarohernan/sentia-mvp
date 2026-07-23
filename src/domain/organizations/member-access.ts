import type { MemberRole } from "./schemas";
import {
  memberHasBusinessAccess,
  type PermissionProfile,
} from "./permission-profiles";

export type MemberAccess = {
  role: MemberRole;
  profile: PermissionProfile | null;
  participatesInListening: boolean;
};

export function resolveMemberAccess(params: MemberAccess) {
  const hasBusinessAccess = memberHasBusinessAccess({
    role: params.role,
    profile: params.profile,
  });

  return {
    hasBusinessAccess,
    participatesInListening:
      params.role !== "owner" &&
      params.role !== "manager" &&
      params.participatesInListening,
    canAccessDashboard: hasBusinessAccess,
    canAccessCollaboratorPortal:
      params.role !== "owner" &&
      params.role !== "manager" &&
      params.participatesInListening,
  };
}

export function getHomePathForMemberAccess(params: MemberAccess) {
  const access = resolveMemberAccess(params);

  if (access.canAccessDashboard) {
    return "/dashboard";
  }

  if (access.canAccessCollaboratorPortal) {
    return "/colaborador";
  }

  return "/dashboard";
}

export function assertMemberHasValidAccess(params: {
  role: MemberRole;
  profile: PermissionProfile | null;
  participatesInListening: boolean;
}) {
  const access = resolveMemberAccess(params);

  if (!access.canAccessDashboard && !access.canAccessCollaboratorPortal) {
    throw new Error(
      "Asigna un rol con permisos de plataforma o activa la participación en Escucha.",
    );
  }
}
