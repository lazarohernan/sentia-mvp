import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("POST /api/feedback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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

  it("accepts a valid feedback payload", async () => {
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
        model: "pysentimiento/robertuito-sentiment-analysis",
        rawLabel: "NEG",
        confidence: 0.91,
        analysis: {
          sentiment: "negative",
          urgency: "high",
        },
      },
    });
  });
});
