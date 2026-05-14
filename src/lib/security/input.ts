const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const WHITESPACE_RUNS = /\s+/g;

export function sanitizeTextInput(value: string) {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(WHITESPACE_RUNS, " ")
    .trim();
}

export function sanitizeEmailInput(value: string) {
  return sanitizeTextInput(value).toLowerCase();
}

export function sanitizeOptionalTextInput(value?: string | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitized = sanitizeTextInput(value);
  return sanitized.length > 0 ? sanitized : undefined;
}
