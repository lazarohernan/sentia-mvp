import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FeedbackPage from "./page";

describe("FeedbackPage", () => {
  it("renders CSAT as the primary satisfaction question", async () => {
    render(
      await FeedbackPage({
        params: Promise.resolve({ branchSlug: "cafeteria-centro" }),
      }),
    );

    expect(
      screen.getByText("Que tan satisfecho quedaste con esta experiencia?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /excelente/i })).toHaveAttribute(
      "name",
      "csatScore",
    );
    expect(screen.getByRole("radio", { name: /muy mal/i })).toHaveAttribute(
      "value",
      "1",
    );
    expect(screen.getByRole("radio", { name: /excelente/i })).toHaveAttribute(
      "value",
      "5",
    );
  });
});
