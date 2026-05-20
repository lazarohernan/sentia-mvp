"use client";

import { MapPin, UserRound } from "lucide-react";
import { useMemo } from "react";

import { formatTableDate } from "@/domain/feedback/record-analysis";
import type { TeamMember } from "@/domain/organizations/team";
import { DashboardDataTable } from "./dashboard-data-table";
import type { DashboardDataTableColumn } from "./dashboard-data-table";

type DashboardTeamTableProps = {
  teamMembers: TeamMember[];
};

const roleStyles: Record<TeamMember["role"], string> = {
  owner: "bg-violet-50 text-violet-800",
  manager: "bg-emerald-50 text-emerald-800",
  collaborator: "bg-slate-100 text-slate-700",
};

function formatBranchLabel(branchName: string | null) {
  return branchName ?? "Sin sucursal asignada";
}

function TeamSummary({ members }: { members: TeamMember[] }) {
  const assignedCount = members.filter((member) => member.branchName).length;
  const managerCount = members.filter((member) => member.role === "manager").length;

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-100 bg-[#f7f8f4] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Colaboradores
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{members.length}</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-[#f7f8f4] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Con sucursal
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{assignedCount}</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-[#f7f8f4] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Gerentes
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{managerCount}</p>
      </div>
    </section>
  );
}

function buildColumns(): Array<DashboardDataTableColumn<TeamMember>> {
  return [
    {
      key: "name",
      header: "Colaborador",
      cell: (member) => (
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
            <UserRound size={16} aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-slate-950">{member.fullName}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Desde {formatTableDate(member.joinedAt)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      cell: (member) => (
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
            roleStyles[member.role],
          ].join(" ")}
        >
          {member.roleLabel}
        </span>
      ),
    },
    {
      key: "branch",
      header: "Sucursal",
      cell: (member) => (
        <div className="flex items-start gap-2">
          <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="font-medium text-slate-700">{formatBranchLabel(member.branchName)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: () => (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          Activo
        </span>
      ),
    },
  ];
}

export function DashboardTeamTable({ teamMembers }: DashboardTeamTableProps) {
  const columns = useMemo(() => buildColumns(), []);
  const branches = useMemo(
    () =>
      Array.from(
        new Set(
          teamMembers
            .map((member) => formatBranchLabel(member.branchName))
            .filter((branch) => branch !== "Sin sucursal asignada"),
        ),
      ).sort((a, b) => a.localeCompare(b, "es")),
    [teamMembers],
  );
  const roles = useMemo(
    () =>
      Array.from(new Set(teamMembers.map((member) => member.roleLabel))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [teamMembers],
  );

  return (
    <DashboardDataTable
      data={teamMembers}
      columns={columns}
      getRowKey={(member) => member.userId}
      getSearchText={(member) =>
        [
          member.fullName,
          member.roleLabel,
          formatBranchLabel(member.branchName),
          "Activo",
        ].join(" ")
      }
      filters={[
        ...(branches.length > 0
          ? [
              {
                key: "branch",
                label: "Filtrar por sucursal",
                options: branches,
                getValue: (member: TeamMember) => formatBranchLabel(member.branchName),
                align: "left" as const,
              },
            ]
          : []),
        ...(roles.length > 1
          ? [
              {
                key: "role",
                label: "Filtrar por rol",
                options: roles,
                getValue: (member: TeamMember) => member.roleLabel,
              },
            ]
          : []),
      ]}
      searchPlaceholder="Buscar colaborador"
      pageSize={10}
      emptyTitle="Sin colaboradores registrados"
      topContent={<TeamSummary members={teamMembers} />}
    />
  );
}
