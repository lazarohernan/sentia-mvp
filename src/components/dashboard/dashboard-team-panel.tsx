"use client";

import type { TeamMember } from "@/domain/organizations/team";
import { DashboardTeamTable } from "./dashboard-team-table";

type DashboardTeamPanelProps = {
  teamMembers: TeamMember[];
  canManageTeam?: boolean;
  onMemberUpdated?: (member: TeamMember) => void;
};

export function DashboardTeamPanel({
  teamMembers,
  canManageTeam = false,
  onMemberUpdated,
}: DashboardTeamPanelProps) {
  return (
    <DashboardTeamTable
      teamMembers={teamMembers}
      canManageTeam={canManageTeam}
      onMemberUpdated={onMemberUpdated}
    />
  );
}
