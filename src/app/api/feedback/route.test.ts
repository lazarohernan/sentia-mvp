import { afterEach, describe, expect, it, vi } from "vitest";

import { clearRateLimitStore } from "@/lib/security/rate-limit";

const maybeSingle = vi.fn(async () => ({ data: null, error: null }));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle,
          })),
        })),
      })),
    })),
  })),
}));

import { POST } from "./route";

describe("POST /api/feedback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearRateLimitStore();
    maybeSingle.mockResolvedValue({ data: null, error: null });
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

  it("returns 404 when branch is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });

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

  it("accepts a valid feedback payload", async () => {
    vi.stubEnv("HUGGINGFACE_API_TOKEN", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
    maybeSingle.mockResolvedValueOnce({
      data: { id: "branch-1", name: "Demo Cafe", organization_id: "org-1" },
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
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
    maybeSingle.mockResolvedValueOnce({
      data: { id: "branch-1", name: "Demo Cafe", organization_id: "org-1" },
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
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
    maybeSingle.mockResolvedValue({
      data: { id: "branch-1", name: "Demo Cafe", organization_id: "org-1" },
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
