import { afterEach, describe, expect, it, vi } from "vitest";

import { clearRateLimitStore } from "@/lib/security/rate-limit";

const branchRows = vi.fn(
  async (): Promise<{
    data: Array<{ id: string; name: string; organization_id: string }>;
    error: null;
  }> => ({ data: [], error: null }),
);
const insertFeedback = vi.fn(async () => ({ error: null }));
const selectFeedbackId = vi.fn(async () => ({
  data: { id: "11111111-1111-4111-8111-111111111111" },
  error: null,
}));
const insertAiAnalysis = vi.fn(async () => ({ error: null }));
const selectBranchById = vi.fn(async () => ({
  data: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Demo Cafe",
    organization_id: "22222222-2222-4222-8222-222222222222",
    slug: "demo-cafe",
  },
  error: null,
}));

function createTableMock(table: string) {
  if (table === "branches") {
    return {
      select: vi.fn((columns?: string) => {
        if (columns === "*") {
          return {
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: selectBranchById,
              })),
            })),
          };
        }

        return {
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: branchRows,
            })),
          })),
        };
      }),
    };
  }

  if (table === "feedback_submissions") {
    return {
      insert: vi.fn((payload: unknown) => {
        insertFeedback(payload);
        return {
          select: vi.fn(() => ({
            single: selectFeedbackId,
          })),
        };
      }),
    };
  }

  if (table === "ai_analyses") {
    return {
      insert: insertAiAnalysis,
    };
  }

  if (table === "notifications") {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
      insert: vi.fn(async () => ({ error: null })),
    };
  }

  return {};
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(createTableMock),
  })),
}));

import { POST } from "./route";

function configureServiceEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sayit.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
}

describe("POST /api/feedback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearRateLimitStore();
    branchRows.mockResolvedValue({ data: [], error: null });
    insertFeedback.mockClear();
    insertAiAnalysis.mockClear();
    selectFeedbackId.mockResolvedValue({
      data: { id: "11111111-1111-4111-8111-111111111111" },
      error: null,
    });
    selectBranchById.mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Demo Cafe",
        organization_id: "22222222-2222-4222-8222-222222222222",
        slug: "demo-cafe",
      },
      error: null,
    });
  });

  it("rejects invalid feedback payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          branchSlug: "demo-cafe",
          type: "complaint",
          freeText: "",
          emotionScore: 2,
          consentAccepted: false,
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 503 instead of accepting feedback when persistence is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          branchSlug: "demo-cafe",
          type: "suggestion",
          csatScore: 4,
          emotionScore: 4,
          freeText: "Seria bueno tener una fila rapida para pedidos pequenos.",
          consentAccepted: true,
        }),
      }),
    );

    expect(response.status).toBe(503);
  });

  it("returns 404 when branch is missing", async () => {
    configureServiceEnv();
    branchRows.mockResolvedValueOnce({ data: [], error: null });

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          branchSlug: "missing-branch",
          type: "complaint",
          csatScore: 2,
          emotionScore: 2,
          freeText: "El servicio fue lento y nadie me dio una respuesta clara.",
          consentAccepted: true,
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 409 when a public slug matches multiple active branches", async () => {
    configureServiceEnv();
    branchRows.mockResolvedValueOnce({
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Demo Cafe",
          organization_id: "22222222-2222-4222-8222-222222222222",
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "Demo Cafe",
          organization_id: "44444444-4444-4444-8444-444444444444",
        },
      ],
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          branchSlug: "demo-cafe",
          type: "complaint",
          csatScore: 2,
          emotionScore: 2,
          freeText: "El servicio fue lento y nadie me dio una respuesta clara.",
          consentAccepted: true,
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(insertFeedback).not.toHaveBeenCalled();
  });

  it("accepts a valid feedback payload", async () => {
    vi.stubEnv("HUGGINGFACE_API_TOKEN", "");
    configureServiceEnv();
    branchRows.mockResolvedValueOnce({
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Demo Cafe",
          organization_id: "22222222-2222-4222-8222-222222222222",
        },
      ],
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          branchSlug: "demo-cafe",
          type: "suggestion",
          npsScore: 8,
          csatScore: 4,
          emotionScore: 4,
          freeText: "Seria bueno tener una fila rapida para pedidos pequenos.",
          consentAccepted: true,
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      status: "accepted",
      analysisStatus: "disabled",
    });
  });

  it("returns sentiment analysis when Hugging Face is configured", async () => {
    vi.stubEnv("HUGGINGFACE_API_TOKEN", "test-token");
    configureServiceEnv();
    branchRows.mockResolvedValueOnce({
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Demo Cafe",
          organization_id: "22222222-2222-4222-8222-222222222222",
        },
      ],
      error: null,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([[{ label: "NEG", score: 0.91 }]], { status: 200 }),
      ),
    );

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          branchSlug: "demo-cafe",
          type: "complaint",
          csatScore: 2,
          emotionScore: 2,
          freeText: "El servicio fue lento y nadie me dio una respuesta clara.",
          consentAccepted: true,
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      status: "accepted",
      analysisStatus: "completed",
      sentimentAnalysis: {
        model: "finiteautomata/beto-sentiment-analysis",
        rawLabel: "NEG",
        confidence: 0.91,
        analysis: {
          sentiment: "negative",
          urgency: "critical",
        },
      },
    });
  });

  it("rate limits repeated feedback submissions from the same IP", async () => {
    configureServiceEnv();
    branchRows.mockResolvedValue({
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Demo Cafe",
          organization_id: "22222222-2222-4222-8222-222222222222",
        },
      ],
      error: null,
    });

    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt < 26; attempt += 1) {
      lastResponse = await POST(
        new Request("http://localhost/api/feedback", {
          method: "POST",
          headers: {
            "x-forwarded-for": "203.0.113.10",
          },
          body: JSON.stringify({
            branchSlug: "demo-cafe",
            type: "suggestion",
            csatScore: 4,
            emotionScore: 4,
            freeText: "Seria bueno tener una fila rapida para pedidos pequenos.",
            consentAccepted: true,
          }),
        }),
      );
    }

    expect(lastResponse?.status).toBe(429);
  });
});
