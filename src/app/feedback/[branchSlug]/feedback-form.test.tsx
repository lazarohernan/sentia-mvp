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
      <FeedbackForm
        branchId="11111111-1111-4111-8111-111111111111"
        branchSlug="cafeteria-centro"
        branchToken="signed-token"
      />,
    );
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    fireEvent.click(screen.getByDisplayValue("5"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "El servicio fue rapido y amable hoy." },
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
        branchId: "11111111-1111-4111-8111-111111111111",
        branchToken: "signed-token",
        type: "compliment",
        csatScore: 5,
        emotionScore: 5,
        freeText: "El servicio fue rapido y amable hoy.",
        consentAccepted: true,
      }),
    });
  });
});
