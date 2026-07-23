"use client";

import { MapPin, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { formatTableDate } from "@/domain/feedback/record-analysis";
import type { PermissionProfile } from "@/domain/organizations/permission-profiles";
import type { TeamMember } from "@/domain/organizations/team";
import { DashboardDataTable } from "./dashboard-data-table";
import type { DashboardDataTableColumn } from "./dashboard-data-table";
import { TeamMemberDetailView } from "./team-member-detail-view";

type DashboardTeamTableProps = {
  teamMembers: TeamMember[];
  canManageTeam?: boolean;
  actorRole?: "owner" | "manager";
  currentUserId?: string;
  permissionProfiles?: PermissionProfile[];
  onMemberUpdated?: (member: TeamMember) => void;
  onMemberRemoved?: (userId: string) => void;
};

const roleStyles: Record<TeamMember["role"], string> = {
  owner: "bg-violet-50 text-violet-800",
  manager: "bg-emerald-50 text-emerald-800",
  collaborator: "bg-slate-100 text-slate-700",
};

const statusStyles = {
  active: "text-emerald-700",
  pending_activation: "text-amber-700",
} as const;

const statusLabels = {
  active: "Activo",
  pending_activation: "Pendiente",
} as const;

function formatBranchLabel(branchName: string | null) {
  return branchName ?? "Sin sucursal asignada";
}

function TeamSummary({ members }: { members: TeamMember[] }) {
  const assignedCount = members.filter((member) => member.branchName).length;
  const managerCount = members.filter((member) => member.role === "manager").length;
  const pendingCount = members.filter(
    (member) => member.accountStatus === "pending_activation",
  ).length;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Colaboradores
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{members.length}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Con sucursal
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{assignedCount}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Gerentes
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{managerCount}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Pendientes
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{pendingCount}</p>
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
              {member.email ?? "Sin correo"} · Desde {formatTableDate(member.joinedAt)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      cell: (member) => (
        <div className="space-y-1">
          <span
            className={[
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              roleStyles[member.role],
            ].join(" ")}
          >
            {member.roleLabel}
          </span>
          {member.permissionProfileName ? (
            <p className="text-xs font-medium text-slate-500">
              {member.permissionProfileName}
            </p>
          ) : (
            <p className="text-xs font-medium text-slate-400">Sin plataforma</p>
          )}
          {member.participatesInListening ? (
            <p className="text-xs font-medium text-slate-700">Escucha</p>
          ) : null}
        </div>
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
      cell: (member) => (
        <span
          className={[
            "text-xs font-semibold",
            statusStyles[member.accountStatus],
          ].join(" ")}
        >
          {statusLabels[member.accountStatus]}
        </span>
      ),
    },
  ];
}

export function DashboardTeamTable({
  teamMembers,
  canManageTeam = false,
  actorRole,
  currentUserId,
  permissionProfiles = [],
  onMemberUpdated,
  onMemberRemoved,
}: DashboardTeamTableProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const columns = useMemo(() => buildColumns(), []);
  const selectedMember =
    teamMembers.find((member) => member.userId === selectedMemberId) ?? null;

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

  function handleMemberUpdated(member: TeamMember) {
    onMemberUpdated?.(member);
  }

  function handleMemberRemoved(userId: string) {
    setSelectedMemberId(null);
    onMemberRemoved?.(userId);
  }

  if (selectedMember) {
    return (
      <TeamMemberDetailView
        member={selectedMember}
        canManageTeam={canManageTeam}
        actorRole={actorRole}
        currentUserId={currentUserId}
        permissionProfiles={permissionProfiles}
        onBack={() => setSelectedMemberId(null)}
        onMemberUpdated={handleMemberUpdated}
        onMemberRemoved={handleMemberRemoved}
      />
    );
  }

  return (
    <DashboardDataTable
      data={teamMembers}
      columns={columns}
      getRowKey={(member) => member.userId}
      onRowClick={(member) => setSelectedMemberId(member.userId)}
      rowActionLabel={(member) => `Ver detalle de ${member.fullName}`}
      getSearchText={(member) =>
        [
          member.fullName,
          member.email,
          member.roleLabel,
          formatBranchLabel(member.branchName),
          statusLabels[member.accountStatus],
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
