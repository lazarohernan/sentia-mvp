import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddTeamMemberDrawer } from "./add-team-member-drawer";

const mallNorteBranch = {
  id: "11111111-1111-4111-8111-111111111111",
  organization_id: "org-1",
  name: "Mall Norte",
  slug: "mall-norte",
  address: "Nivel 2",
  is_active: true,
  created_at: "2026-05-01T10:00:00.000Z",
};

describe("AddTeamMemberDrawer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses one role selector based on permission profiles when inviting a collaborator", async () => {
    const onSaved = vi.fn();
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual(
        expect.objectContaining({
          role: "manager",
          organizationRoleId: "22222222-2222-4222-8222-222222222222",
          participatesInListening: false,
        }),
      );

      return Response.json(
        {
          member: {
            userId: "user-1",
            branchId: "11111111-1111-4111-8111-111111111111",
            branchName: "Mall Norte",
            fullName: "Ana Lopez",
            email: "ana@empresa.com",
            role: "manager",
            roleLabel: "Gerente",
            participatesInListening: false,
            joinedAt: "2026-05-01T10:00:00.000Z",
            accountStatus: "pending_activation",
          },
          inviteLink: "http://localhost/auth/callback?token_hash=test",
        },
        { status: 201 },
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AddTeamMemberDrawer
        open
        onClose={() => undefined}
        branches={[mallNorteBranch]}
        actorRole="owner"
        permissionProfiles={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Gerente de tienda",
            permissions: ["summary", "team"],
          },
        ]}
        onSaved={onSaved}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Ana Lopez" },
    });
    fireEvent.change(screen.getByLabelText("Correo electronico"), {
      target: { value: "ana@empresa.com" },
    });
    expect(screen.getAllByRole("combobox", { name: "Rol" })).toHaveLength(1);
    expect(screen.queryByRole("combobox", { name: "Perfil de permisos" })).toBeNull();

    fireEvent.change(screen.getByRole("combobox", { name: "Rol" }), {
      target: { value: "22222222-2222-4222-8222-222222222222" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar colaborador" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          permissionProfileId: "22222222-2222-4222-8222-222222222222",
          permissionProfileName: "Gerente de tienda",
        }),
      );
    });
  });

  it("confirms that the activation email was sent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            member: {
              userId: "user-1",
              branchId: null,
              branchName: null,
              fullName: "Ana Lopez",
              email: "ana@empresa.com",
              role: "collaborator",
              roleLabel: "Colaborador",
              joinedAt: "2026-05-01T10:00:00.000Z",
              accountStatus: "pending_activation",
            },
            inviteLink: "http://localhost/auth/callback?token_hash=test",
            inviteEmailStatus: "sent",
          },
          { status: 201 },
        ),
      ),
    );

    render(
      <AddTeamMemberDrawer
        open
        onClose={() => undefined}
        branches={[]}
        actorRole="owner"
        onSaved={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Ana Lopez" },
    });
    fireEvent.change(screen.getByLabelText("Correo electronico"), {
      target: { value: "ana@empresa.com" },
    });
    fireEvent.click(screen.getByRole("switch", { name: /participa en escucha/i }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar colaborador" }));

    await waitFor(() => {
      expect(screen.getByText("Invitación enviada")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /copiar/i })).toBeNull();
  });
});
