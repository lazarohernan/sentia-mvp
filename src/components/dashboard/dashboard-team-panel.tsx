"use client";

import type { TeamMember } from "@/domain/organizations/team";
import { DashboardTeamTable } from "./dashboard-team-table";

type DashboardTeamPanelProps = {
  teamMembers: TeamMember[];
};

export function DashboardTeamPanel({ teamMembers }: DashboardTeamPanelProps) {
  return <DashboardTeamTable teamMembers={teamMembers} />;
}
