export const PUSH_PROMPT_SKIPPED_KEY = "perks.push.prompt.skipped.v1";
export const PUSH_PROMPT_SESSION_DISMISSED_KEY = "perks.push.prompt.session.v1";

export function hasSkippedPushPrompt() {
  if (typeof window === "undefined") {
    return true;
  }

  return (
    window.localStorage.getItem(PUSH_PROMPT_SKIPPED_KEY) === "1" ||
    window.sessionStorage.getItem(PUSH_PROMPT_SESSION_DISMISSED_KEY) === "1"
  );
}

export function markPushPromptSkipped() {
  window.localStorage.setItem(PUSH_PROMPT_SKIPPED_KEY, "1");
}

export function markPushPromptDismissedForSession() {
  window.sessionStorage.setItem(PUSH_PROMPT_SESSION_DISMISSED_KEY, "1");
}

export function shouldPersistPushPromptSkip(state: string) {
  return state === "ready" || state === "error" || state === "blocked";
}
