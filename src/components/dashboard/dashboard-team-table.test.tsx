import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardTeamTable } from "./dashboard-team-table";

describe("DashboardTeamTable", () => {
  it("renders collaborators in a paginated table", () => {
    render(
      <DashboardTeamTable
        teamMembers={[
          {
            userId: "user-1",
            branchId: "branch-1",
            branchName: "Mall Norte",
            fullName: "Ana Lopez",
            email: "ana@empresa.com",
            role: "collaborator",
            roleLabel: "Colaborador",
            participatesInListening: true,
            joinedAt: "2026-05-01T10:00:00.000Z",
            accountStatus: "pending_activation",
          },
          {
            userId: "user-2",
            branchId: null,
            branchName: null,
            fullName: "Carlos Mejia",
            email: "carlos@empresa.com",
            role: "manager",
            roleLabel: "Gerente",
            participatesInListening: false,
            joinedAt: "2026-05-10T10:00:00.000Z",
            accountStatus: "active",
          },
        ]}
      />,
    );

    expect(screen.getByText("Ana Lopez")).toBeInTheDocument();
    expect(screen.getByText("Carlos Mejia")).toBeInTheDocument();
    expect(screen.getByText("Mall Norte")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("1-2 de 2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar colaborador")).toBeInTheDocument();
  });

  it("shows an empty state when there are no collaborators", () => {
    render(<DashboardTeamTable teamMembers={[]} />);

    expect(screen.getByText("Sin colaboradores registrados")).toBeInTheDocument();
    expect(screen.getByText("0 resultados")).toBeInTheDocument();
  });
});
