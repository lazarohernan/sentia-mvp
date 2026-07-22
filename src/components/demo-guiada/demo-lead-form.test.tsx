import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DemoLeadForm } from "./demo-lead-form";
import { DEMO_LEAD_STORAGE_KEY } from "@/lib/demo-guiada/steps";

describe("DemoLeadForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves the lead locally and continues", () => {
    const onSubmit = vi.fn();
    render(<DemoLeadForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/tu nombre/i), {
      target: { value: "Ana López" },
    });
    fireEvent.change(screen.getByPlaceholderText(/tu@empresa.com/i), {
      target: { value: "ana@empresa.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+504/i), {
      target: { value: "+504 9999-8888" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continuar al recorrido/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ana López",
        email: "ana@empresa.com",
        phone: "+504 9999-8888",
      }),
    );
    expect(window.localStorage.getItem(DEMO_LEAD_STORAGE_KEY)).toContain("ana@empresa.com");
  });
});
