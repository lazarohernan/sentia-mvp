import { describe, expect, it } from "vitest";

import { buildDashboardAlertItems } from "./alerts";

describe("buildDashboardAlertItems", () => {
  it("merges danger notifications and attention queue items", () => {
    const alerts = buildDashboardAlertItems({
      notifications: [
        {
          id: "n1",
          title: "Sucursal Norte en riesgo",
          detail: "3 comentarios requieren seguimiento",
          time: "Hace 1 h",
          href: "/dashboard#alertas",
          unread: true,
          tone: "danger",
        },
        {
          id: "n2",
          title: "Resumen positivo",
          detail: "Todo estable",
          time: "Hace 2 h",
          href: "/dashboard#resumen",
          unread: false,
          tone: "success",
        },
      ],
      attentionItems: [
        {
          priority: "Prioridad alta",
          title: "Sucursal Norte - Espera",
          description: "Revisar fila en caja",
          owner: "Operaciones",
          probableCause: "Sobrecarga en caja durante la tarde.",
          suggestedSla: "Hoy mismo",
          requiresContact: true,
          age: "20 min",
          status: "Pendiente",
          tone: "danger",
        },
      ],
    });

    expect(alerts).toHaveLength(2);
    expect(alerts[0]?.title).toBe("Sucursal Norte en riesgo");
    expect(alerts[1]?.title).toBe("Sucursal Norte - Espera");
    expect(alerts[1]?.owner).toBe("Operaciones");
    expect(alerts[1]?.suggestedSla).toBe("Hoy mismo");
    expect(alerts[1]?.requiresContact).toBe(true);
  });
});
