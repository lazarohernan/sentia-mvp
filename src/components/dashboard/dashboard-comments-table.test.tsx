import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardCommentsTable } from "./dashboard-comments-table";
import { dashboardMockComments } from "./dashboard.mock-data";

describe("DashboardCommentsTable", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the reusable table structure without records", () => {
    render(<DashboardCommentsTable />);

    expect(screen.getByRole("tab", { name: /listado/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Opiniones")).toBeInTheDocument();
    expect(screen.getByText("Sin valoraciones registradas")).toBeInTheDocument();
    expect(screen.getByText("0 resultados")).toBeInTheDocument();
  });

  it("shows ratings health distribution from scored comments", () => {
    render(<DashboardCommentsTable comments={dashboardMockComments} />);

    fireEvent.click(screen.getByRole("tab", { name: /gráficos/i }));

    expect(screen.getByText("Salud de valoraciones")).toBeInTheDocument();
    expect(screen.getByText("Cómo calificaron los clientes")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Información sobre cómo leer esta gráfica",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /Atención urgente: 3 valoraciones, 43%/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 valoraciones \(43%\)/)).toBeInTheDocument();
    expect(screen.getByTitle(/Atención urgente: 3 valoraciones \(43%\)/)).toBeInTheDocument();
  });

  it("renders comments in a paginated reusable table", () => {
    render(<DashboardCommentsTable comments={dashboardMockComments} />);

    expect(
      screen.getByRole("combobox", { name: "Filtrar por sucursal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Filtrar por tipo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1-5 de 7")).toBeInTheDocument();
    expect(screen.getByText("Cliente verificado")).toBeInTheDocument();
    expect(screen.getAllByText("Felicitación").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5/5").length).toBeGreaterThan(0);
    expect(
      screen.getAllByLabelText(/CSAT 5 de 5, Excelente/i).length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByLabelText(/CSAT 5 de 5, Excelente/i)[0]);

    expect(
      screen.getByRole("dialog", { name: /detalle csat 5 de 5/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Escala CSAT")).toBeInTheDocument();
    expect(
      screen.getByText("Experiencia altamente satisfactoria."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    fireEvent.click(screen.getByRole("button", { name: "Pagina siguiente" }));

    expect(screen.getByText("6-7 de 7")).toBeInTheDocument();
    expect(screen.getByText("Cliente recurrente")).toBeInTheDocument();
  });

  it("filters comments by branch", () => {
    render(<DashboardCommentsTable comments={dashboardMockComments} />);

    fireEvent.click(
      screen.getByRole("combobox", { name: "Filtrar por sucursal" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "Boulevard" }));

    expect(screen.getByText("1-2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Visita familiar")).toBeInTheDocument();
    expect(screen.queryByText("Cliente verificado")).not.toBeInTheDocument();
  });

  it("filters comments by feedback type", () => {
    render(<DashboardCommentsTable comments={dashboardMockComments} />);

    fireEvent.click(
      screen.getByRole("combobox", { name: "Filtrar por tipo" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "Queja" }));

    expect(screen.getByText("1-2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Compra reciente")).toBeInTheDocument();
    expect(screen.queryByText("Cliente verificado")).not.toBeInTheDocument();
  });

  it("opens a comment detail view from the table", () => {
    render(
      <DashboardCommentsTable
        comments={dashboardMockComments}
        canManageFollowUp
      />,
    );

    fireEvent.click(screen.getByText("Cliente verificado"));

    expect(screen.getByText("Detalle de valoración")).toBeInTheDocument();
    expect(screen.getByText("Valoración recibida")).toBeInTheDocument();
    expect(screen.getAllByText("Felicitación").length).toBeGreaterThan(0);
    expect(screen.getByText("Lectura operativa")).toBeInTheDocument();
    expect(screen.getByText("Marcar en revisión")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Volver a valoraciones" }),
    );

    expect(screen.getByText("1-5 de 7")).toBeInTheDocument();
  });

  it("updates the visual workflow status from the detail view", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          status: "Escalado",
          actions: [],
        }),
      ),
    );

    render(
      <DashboardCommentsTable
        comments={dashboardMockComments}
        canManageFollowUp
      />,
    );

    fireEvent.click(screen.getByText("Cliente verificado"));
    fireEvent.click(screen.getByRole("button", { name: "Escalado" }));

    await waitFor(() => {
      expect(
        screen.getByText("Necesita atención de un responsable superior."),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Volver a valoraciones" }),
    );

    expect(screen.getByText("Escalado")).toBeInTheDocument();
  });
});
