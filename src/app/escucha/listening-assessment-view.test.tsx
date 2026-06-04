import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ListeningAssessmentView } from "./listening-assessment-view";

const assignedBranch = {
  id: "11111111-1111-4111-8111-111111111111",
  organization_id: "org-1",
  name: "Norte",
  slug: "norte",
  address: null,
  is_active: true,
  created_at: "2026-06-03T00:00:00.000Z",
};

describe("ListeningAssessmentView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves the selected listening level and replaces the form with a thank-you state", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        branchId: assignedBranch.id,
        level: "debate",
        note: "Escuche con apertura durante una queja.",
      });

      return Response.json({ event: { id: "event-1" } }, { status: 201 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <ListeningAssessmentView
        assignedBranch={assignedBranch}
        organizationName="Empresa Demo"
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Debate/i }));
    fireEvent.change(screen.getByLabelText("Reflexión del turno"), {
      target: { value: "Escuche con apertura durante una queja." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar evaluación" }));

    await waitFor(() => {
      expect(screen.getByText("Opinión enviada. Gracias.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Selecciona una opción")).not.toBeInTheDocument();
  });
});
