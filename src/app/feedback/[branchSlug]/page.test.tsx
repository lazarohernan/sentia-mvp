import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/config", () => ({
  hasSupabaseServiceEnv: vi.fn(() => true),
}));

vi.mock("@/lib/security/qr-signing", () => ({
  hasQrSigningSecret: vi.fn(() => true),
  getQrSigningSecret: vi.fn(() => "test-qr-signing-secret"),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/domain/branches/repository", () => ({
  getActiveBranchById: vi.fn(),
  getActiveBranchesBySlug: vi.fn(),
}));

vi.mock("@/domain/organizations/organization-settings", () => ({
  getOrganizationSettingsById: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => (name === "host" ? "localhost:3000" : null),
  })),
}));

import { getActiveBranchesBySlug } from "@/domain/branches/repository";
import { getOrganizationSettingsById } from "@/domain/organizations/organization-settings";
import FeedbackPage from "./page";

describe("FeedbackPage", () => {
  beforeEach(() => {
    vi.mocked(getActiveBranchesBySlug).mockResolvedValue([
      {
        id: "11111111-1111-4111-8111-111111111111",
        organization_id: "org-1",
        name: "Cafeteria Centro",
        slug: "cafeteria-centro",
        address: null,
        is_active: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ]);
    vi.mocked(getOrganizationSettingsById).mockResolvedValue({
      id: "org-1",
      name: "Cafe Central",
      slug: "cafe-central",
      logoUrl: "https://example.com/logo.png",
      tagline: "Cafe de especialidad",
      description: null,
      contactEmail: null,
      contactPhone: null,
      websiteUrl: null,
      address: null,
      alertEscalationPhone: null,
      alertEscalationEmail: null,
      peakHours: null,
      servicePriorities: null,
      compensationPolicy: null,
      followUpTone: null,
      agentNotes: null,
      reportCadence: "monthly",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("renders business trust header and CSAT form", async () => {
    const { render, screen } = await import("@testing-library/react");

    render(
      await FeedbackPage({
        params: Promise.resolve({ branchSlug: "cafeteria-centro" }),
      }),
    );

    expect(screen.getByAltText("Logo de Cafe Central")).toBeInTheDocument();
    expect(screen.getByText("Perks")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cafe Central" })).toBeInTheDocument();
    expect(screen.getByText("Cafeteria Centro")).toBeInTheDocument();
    expect(screen.getByText(/verifica que estas en el lugar correcto/i)).toBeInTheDocument();
    expect(
      screen.getByText("Que tan satisfecho quedaste con esta experiencia?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /excelente/i })).toHaveAttribute(
      "name",
      "csatScore",
    );
  });
});
