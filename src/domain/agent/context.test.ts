import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildAgentContextSnapshot } from "./context";

vi.mock("@/domain/organizations/organization-settings", () => ({
  getOrganizationSettingsById: vi.fn(),
}));

import { getOrganizationSettingsById } from "@/domain/organizations/organization-settings";

describe("buildAgentContextSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes operational knowledge from organization settings", async () => {
    vi.mocked(getOrganizationSettingsById).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Perks",
      slug: "perks",
      logoUrl: null,
      tagline: null,
      description: null,
      contactEmail: null,
      contactPhone: null,
      websiteUrl: null,
      address: null,
      alertEscalationPhone: null,
      alertEscalationEmail: null,
      peakHours: "viernes 5pm a 8pm",
      servicePriorities: "rapidez en caja y limpieza",
      compensationPolicy: "disculpa y bebida cuando aplique",
      followUpTone: "cercano y breve",
      agentNotes: "validar promo antes de escalar precio",
      createdAt: "2026-06-01T00:00:00.000Z",
    });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "branches") {
          return {
            select: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "branch-1",
                        name: "Centro",
                        organization_id: "550e8400-e29b-41d4-a716-446655440000",
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          };
        }

        if (table === "feedback_submissions") {
          return {
            select: () => ({
              in: () => ({
                gte: () => ({
                  lte: () => ({
                    order: () => ({
                      limit: () =>
                        Promise.resolve({
                          data: [
                            {
                              id: "feedback-1",
                              type: "observation",
                              csat_score: 2,
                              free_text: "La fila fue lenta y nadie aviso.",
                              created_at: "2026-06-10T12:00:00.000Z",
                              branch_id: "branch-1",
                              branches: {
                                id: "branch-1",
                                name: "Centro",
                                organization_id:
                                  "550e8400-e29b-41d4-a716-446655440000",
                              },
                            },
                          ],
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "ai_analyses") {
          return {
            select: () => ({
              in: () => ({
                order: () =>
                  Promise.resolve({
                    data: [
                      {
                        submission_id: "feedback-1",
                        sentiment: "negative",
                        category: "Tiempo de espera",
                        summary: "Hubo atraso en caja.",
                        recommended_action: "Revisar apoyo en hora pico.",
                        information_quality: "sufficient",
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    const snapshot = await buildAgentContextSnapshot(client as never, {
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      period: "7d",
    });

    expect(snapshot.knowledge).toEqual({
      peakHours: "viernes 5pm a 8pm",
      servicePriorities: "rapidez en caja y limpieza",
      compensationPolicy: "disculpa y bebida cuando aplique",
      followUpTone: "cercano y breve",
      agentNotes: "validar promo antes de escalar precio",
    });
    expect(snapshot.branchReports[0]?.branch).toBe("Centro");
    expect(snapshot.recentComments[0]?.dominantPattern).toBe("Tiempo de espera");
  });

  it("detects peak hours automatically when the business has not configured them", async () => {
    vi.mocked(getOrganizationSettingsById).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Perks",
      slug: "perks",
      logoUrl: null,
      tagline: null,
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
      createdAt: "2026-06-01T00:00:00.000Z",
    });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "branches") {
          return {
            select: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "branch-1",
                        name: "Centro",
                        organization_id: "550e8400-e29b-41d4-a716-446655440000",
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          };
        }

        if (table === "feedback_submissions") {
          return {
            select: () => ({
              in: () => ({
                gte: () => ({
                  lte: () => ({
                    order: () => ({
                      limit: () =>
                        Promise.resolve({
                          data: [
                            {
                              id: "feedback-1",
                              type: "observation",
                              csat_score: 2,
                              free_text: "Muy lenta la caja.",
                              created_at: "2026-06-12T23:15:00.000Z",
                              branch_id: "branch-1",
                              branches: {
                                id: "branch-1",
                                name: "Centro",
                                organization_id:
                                  "550e8400-e29b-41d4-a716-446655440000",
                              },
                            },
                            {
                              id: "feedback-2",
                              type: "complaint",
                              csat_score: 1,
                              free_text: "Mucha espera para pagar.",
                              created_at: "2026-06-12T23:45:00.000Z",
                              branch_id: "branch-1",
                              branches: {
                                id: "branch-1",
                                name: "Centro",
                                organization_id:
                                  "550e8400-e29b-41d4-a716-446655440000",
                              },
                            },
                            {
                              id: "feedback-3",
                              type: "complaint",
                              csat_score: 2,
                              free_text: "Se hizo larga la fila.",
                              created_at: "2026-06-13T00:10:00.000Z",
                              branch_id: "branch-1",
                              branches: {
                                id: "branch-1",
                                name: "Centro",
                                organization_id:
                                  "550e8400-e29b-41d4-a716-446655440000",
                              },
                            },
                            {
                              id: "feedback-4",
                              type: "observation",
                              csat_score: 3,
                              free_text: "Normal.",
                              created_at: "2026-06-11T15:10:00.000Z",
                              branch_id: "branch-1",
                              branches: {
                                id: "branch-1",
                                name: "Centro",
                                organization_id:
                                  "550e8400-e29b-41d4-a716-446655440000",
                              },
                            },
                          ],
                          error: null,
                        }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "ai_analyses") {
          return {
            select: () => ({
              in: () => ({
                order: () =>
                  Promise.resolve({
                    data: [
                      {
                        submission_id: "feedback-1",
                        sentiment: "negative",
                        category: "Tiempo de espera",
                        summary: "Atraso en caja.",
                        recommended_action: "Revisar apoyo en caja.",
                        information_quality: "sufficient",
                      },
                      {
                        submission_id: "feedback-2",
                        sentiment: "negative",
                        category: "Tiempo de espera",
                        summary: "Atraso en caja.",
                        recommended_action: "Revisar apoyo en caja.",
                        information_quality: "sufficient",
                      },
                      {
                        submission_id: "feedback-3",
                        sentiment: "negative",
                        category: "Tiempo de espera",
                        summary: "Atraso en caja.",
                        recommended_action: "Revisar apoyo en caja.",
                        information_quality: "sufficient",
                      },
                      {
                        submission_id: "feedback-4",
                        sentiment: "neutral",
                        category: "Experiencia general",
                        summary: "Comentario general.",
                        recommended_action: "Monitorear.",
                        information_quality: "partial",
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    const snapshot = await buildAgentContextSnapshot(client as never, {
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      period: "7d",
    });

    expect(snapshot.knowledge.peakHours).toContain("Centro:");
  });
});
