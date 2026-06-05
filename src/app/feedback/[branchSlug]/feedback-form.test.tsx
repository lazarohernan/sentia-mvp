import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedbackForm } from "./feedback-form";

describe("FeedbackForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits feedback to the public API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ status: "accepted", analysisStatus: "disabled" }, { status: 202 }),
      ),
    );

    const { container } = render(
      <FeedbackForm branchSlug="cafeteria-centro" />,
    );
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    fireEvent.click(screen.getByDisplayValue("5"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: {
        value:
          "El servicio fue rapido y amable hoy, el personal resolvio todo en caja.",
      },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/gracias por tu comentario/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/feedback/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchSlug: "cafeteria-centro" }),
    });
    expect(fetch).toHaveBeenCalledWith("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchSlug: "cafeteria-centro",
        type: "compliment",
        csatScore: 5,
        emotionScore: 5,
        freeText:
          "El servicio fue rapido y amable hoy, el personal resolvio todo en caja.",
        consentAccepted: true,
      }),
    });
  });

  it("asks one adaptive follow-up before submitting ambiguous feedback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ status: "accepted", analysisStatus: "disabled" }, { status: 202 }),
      ),
    );

    const { container } = render(
      <FeedbackForm branchSlug="cafeteria-centro" />,
    );
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    fireEvent.click(screen.getByDisplayValue("3"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Estuvo bien, pero hay mucho que mejorar." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(form!);

    expect(screen.getByText(/principal que podría mejorar/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/feedback",
      expect.any(Object),
    );

    fireEvent.click(screen.getByDisplayValue("wait_time"));
    fireEvent.change(screen.getByPlaceholderText(/la espera fue larga/i), {
      target: { value: "La fila se sintió lenta al pagar." },
    });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/gracias por tu comentario/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchSlug: "cafeteria-centro",
        type: "suggestion",
        csatScore: 3,
        emotionScore: 3,
        freeText: "Estuvo bien, pero hay mucho que mejorar.",
        clarification: {
          question: "¿Qué fue lo principal que podría mejorar?",
          category: "wait_time",
          detail: "La fila se sintió lenta al pagar.",
        },
        consentAccepted: true,
      }),
    });
  });
});
