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
            role: "collaborator",
            roleLabel: "Colaborador",
            joinedAt: "2026-05-01T10:00:00.000Z",
          },
          {
            userId: "user-2",
            branchId: null,
            branchName: null,
            fullName: "Carlos Mejia",
            role: "manager",
            roleLabel: "Gerente",
            joinedAt: "2026-05-10T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Ana Lopez")).toBeInTheDocument();
    expect(screen.getByText("Carlos Mejia")).toBeInTheDocument();
    expect(screen.getByText("Mall Norte")).toBeInTheDocument();
    expect(screen.getByText("Sin sucursal asignada")).toBeInTheDocument();
    expect(screen.getByText("1-2 de 2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar colaborador")).toBeInTheDocument();
  });

  it("shows an empty state when there are no collaborators", () => {
    render(<DashboardTeamTable teamMembers={[]} />);

    expect(screen.getByText("Sin colaboradores registrados")).toBeInTheDocument();
    expect(screen.getByText("0 resultados")).toBeInTheDocument();
  });
});
