import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingWorkflowSection } from "./landing-workflow-section";

describe("LandingWorkflowSection", () => {
  it("changes the supporting image when a step is selected", () => {
    render(<LandingWorkflowSection />);

    expect(screen.getByAltText(/farmacéutica conversa/i)).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /aclara lo que falta/i }));
    });

    expect(screen.getByAltText(/responsables de una cooperativa/i)).toBeInTheDocument();
  });
});
