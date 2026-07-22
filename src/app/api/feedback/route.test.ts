import { afterEach, describe, expect, it, vi } from "vitest";

import { createBranchQrToken } from "@/domain/branches/qr-token";
import { clearRateLimitStore } from "@/lib/security/rate-limit";

const BRANCH_ID = "11111111-1111-4111-8111-111111111111";
const ORG_ID = "22222222-2222-4222-8222-222222222222";
const BRANCH_SLUG = "demo-cafe";

const selectBranchById = vi.fn(async () => ({
  data: {
    id: BRANCH_ID,
    name: "Demo Cafe",
    organization_id: ORG_ID,
    slug: BRANCH_SLUG,
  },
  error: null,
}));
const insertFeedback = vi.fn(async (payload?: unknown) => {
  void payload;
  return { error: null };
});
const selectFeedbackId = vi.fn(async () => ({
  data: { id: BRANCH_ID },
  error: null,
}));
const insertAiAnalysis = vi.fn(async () => ({ error: null }));
const insertAiUsageEvent = vi.fn(async () => ({ error: null }));

function createTableMock(table: string) {
  if (table === "branches") {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: selectBranchById,
          })),
        })),
      })),
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

  if (table === "ai_usage_events") {
    return {
      insert: insertAiUsageEvent,
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
  vi.stubEnv("QR_SIGNING_SECRET", "test-qr-signing-secret");
}

function signedPayload(overrides: Record<string, unknown> = {}) {
  const branchToken = createBranchQrToken({
    branchId: BRANCH_ID,
    branchSlug: BRANCH_SLUG,
    organizationId: ORG_ID,
  });

  return {
    branchSlug: BRANCH_SLUG,
    branchId: BRANCH_ID,
    branchToken,
    type: "suggestion",
    csatScore: 4,
    emotionScore: 4,
    freeText: "Seria bueno tener una fila rapida para pedidos pequenos.",
    consentAccepted: true,
    ...overrides,
  };
}

describe("POST /api/feedback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearRateLimitStore();
    insertFeedback.mockClear();
    insertAiAnalysis.mockClear();
    insertAiUsageEvent.mockClear();
    selectFeedbackId.mockResolvedValue({
      data: { id: BRANCH_ID },
      error: null,
    });
    selectBranchById.mockResolvedValue({
      data: {
        id: BRANCH_ID,
        name: "Demo Cafe",
        organization_id: ORG_ID,
        slug: BRANCH_SLUG,
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

  it("rejects slug-only payloads without a signed QR token", async () => {
    configureServiceEnv();

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          branchSlug: BRANCH_SLUG,
          type: "suggestion",
          csatScore: 4,
          emotionScore: 4,
          freeText: "Seria bueno tener una fila rapida para pedidos pequenos.",
          consentAccepted: true,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(insertFeedback).not.toHaveBeenCalled();
  });

  it("returns 503 instead of accepting feedback when persistence is not configured", async () => {
    vi.stubEnv("QR_SIGNING_SECRET", "test-qr-signing-secret");

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify(signedPayload()),
      }),
    );

    expect(response.status).toBe(503);
  });

  it("returns 404 when branch is missing", async () => {
    configureServiceEnv();
    selectBranchById.mockResolvedValueOnce({ data: null, error: null } as never);

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify(signedPayload()),
      }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 403 when the signed token is invalid", async () => {
    configureServiceEnv();

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify(
          signedPayload({
            branchToken: "invalid-token-value-123456",
          }),
        ),
      }),
    );

    expect(response.status).toBe(403);
    expect(insertFeedback).not.toHaveBeenCalled();
  });

  it("accepts a valid signed feedback payload", async () => {
    vi.stubEnv("HUGGINGFACE_API_TOKEN", "");
    configureServiceEnv();

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify(signedPayload()),
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([[{ label: "NEG", score: 0.91 }]], { status: 200 }),
      ),
    );

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify(
          signedPayload({
            type: "complaint",
            csatScore: 2,
            emotionScore: 2,
            freeText: "El servicio fue lento y nadie me dio una respuesta clara.",
          }),
        ),
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

    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt < 26; attempt += 1) {
      lastResponse = await POST(
        new Request("http://localhost/api/feedback", {
          method: "POST",
          headers: {
            "x-forwarded-for": "203.0.113.10",
          },
          body: JSON.stringify(signedPayload()),
        }),
      );
    }

    expect(lastResponse?.status).toBe(429);
  });
});
