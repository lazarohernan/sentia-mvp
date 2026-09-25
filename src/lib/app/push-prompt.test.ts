import { afterEach, describe, expect, it } from "vitest";

import {
  PUSH_PROMPT_SESSION_DISMISSED_KEY,
  PUSH_PROMPT_SKIPPED_KEY,
  hasSkippedPushPrompt,
  markPushPromptDismissedForSession,
  markPushPromptSkipped,
  shouldPersistPushPromptSkip,
} from "./push-prompt";

describe("push prompt storage", () => {
  afterEach(() => {
    window.localStorage.removeItem(PUSH_PROMPT_SKIPPED_KEY);
    window.sessionStorage.removeItem(PUSH_PROMPT_SESSION_DISMISSED_KEY);
  });

  it("starts unskipped", () => {
    expect(hasSkippedPushPrompt()).toBe(false);
  });

  it("remembers when the user postpones activation on a capable device", () => {
    markPushPromptSkipped();
    expect(hasSkippedPushPrompt()).toBe(true);
  });

  it("only dismisses for this session when the device still cannot activate", () => {
    markPushPromptDismissedForSession();
    expect(hasSkippedPushPrompt()).toBe(true);
    expect(window.localStorage.getItem(PUSH_PROMPT_SKIPPED_KEY)).toBeNull();
  });

  it("persists skip only when the user could have activated", () => {
    expect(shouldPersistPushPromptSkip("ready")).toBe(true);
    expect(shouldPersistPushPromptSkip("blocked")).toBe(true);
    expect(shouldPersistPushPromptSkip("error")).toBe(true);
    expect(shouldPersistPushPromptSkip("unsupported")).toBe(false);
  });
});
