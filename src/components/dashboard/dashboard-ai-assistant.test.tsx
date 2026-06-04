import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardAiAssistant } from "./dashboard-ai-assistant";

describe("DashboardAiAssistant", () => {
  it("opens a floating assistant with insight and active alert", () => {
    render(
      <DashboardAiAssistant
        insight={{
          status: "Insight IA",
          confidence: "Alta",
          headline: "Mall Norte necesita revisión",
          detail: "Suben las quejas por espera.",
          action: "Asignar gerente de turno",
          dominantPattern: "Espera",
          dominantPatternDetail: "Tema repetido",
          actionDetail: "Revisar turnos",
          reasonMetrics: [],
        }}
        alerts={[
          {
            id: "alert-1",
            title: "Tiempo de espera alto",
            subtitle: "Operaciones · hace 2h",
            detail: "Clientes reportan fila larga.",
            priority: "Prioridad alta",
            tone: "danger",
            unread: true,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir asistente IA de alertas" }));

    expect(screen.getByRole("region", { name: "Asistente IA de alertas" })).toBeInTheDocument();
    expect(screen.getByText("Monitor operativo")).toBeInTheDocument();
    expect(screen.getByText("Mall Norte necesita revisión")).toBeInTheDocument();
    expect(screen.getByText("Tiempo de espera alto")).toBeInTheDocument();
  });
});
