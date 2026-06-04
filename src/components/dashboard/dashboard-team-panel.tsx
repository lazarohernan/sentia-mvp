"use client";

import type { PermissionProfile } from "@/domain/organizations/permission-profiles";
import type { TeamMember } from "@/domain/organizations/team";
import { DashboardTeamTable } from "./dashboard-team-table";

type DashboardTeamPanelProps = {
  teamMembers: TeamMember[];
  canManageTeam?: boolean;
  actorRole?: "owner" | "manager";
  currentUserId?: string;
  permissionProfiles?: PermissionProfile[];
  onMemberUpdated?: (member: TeamMember) => void;
  onMemberRemoved?: (userId: string) => void;
};

export function DashboardTeamPanel({
  teamMembers,
  canManageTeam = false,
  actorRole,
  currentUserId,
  permissionProfiles = [],
  onMemberUpdated,
  onMemberRemoved,
}: DashboardTeamPanelProps) {
  return (
    <DashboardTeamTable
      teamMembers={teamMembers}
      canManageTeam={canManageTeam}
      actorRole={actorRole}
      currentUserId={currentUserId}
      permissionProfiles={permissionProfiles}
      onMemberUpdated={onMemberUpdated}
      onMemberRemoved={onMemberRemoved}
    />
  );
}
