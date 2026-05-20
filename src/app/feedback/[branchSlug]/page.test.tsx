import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/config", () => ({
  hasSupabaseServiceEnv: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/domain/branches/repository", () => ({
  getActiveBranchBySlug: vi.fn(),
}));

import { getActiveBranchBySlug } from "@/domain/branches/repository";
import FeedbackPage from "./page";

describe("FeedbackPage", () => {
  beforeEach(() => {
    vi.mocked(getActiveBranchBySlug).mockResolvedValue({
      id: "branch-1",
      organization_id: "org-1",
      name: "Cafeteria Centro",
      slug: "cafeteria-centro",
      address: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
    });
  });

  it("renders CSAT as the primary satisfaction question", async () => {
    const { render, screen } = await import("@testing-library/react");

    render(
      await FeedbackPage({
        params: Promise.resolve({ branchSlug: "cafeteria-centro" }),
      }),
    );

    expect(
      screen.getByText("Que tan satisfecho quedaste con esta experiencia?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cafeteria Centro" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /excelente/i })).toHaveAttribute(
      "name",
      "csatScore",
    );
  });
});
