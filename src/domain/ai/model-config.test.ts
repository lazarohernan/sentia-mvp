import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_OPENAI_MODEL, getOpenAIModel } from "./model-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getOpenAIModel", () => {
  it("uses gpt-5.4-mini by default", () => {
    vi.stubEnv("OPENAI_MODEL", "");
    expect(getOpenAIModel()).toBe(DEFAULT_OPENAI_MODEL);
  });

  it("allows one explicit platform-wide override", () => {
    vi.stubEnv("OPENAI_MODEL", "gpt-5.4-mini-2026-03-17");
    expect(getOpenAIModel()).toBe("gpt-5.4-mini-2026-03-17");
  });
});
