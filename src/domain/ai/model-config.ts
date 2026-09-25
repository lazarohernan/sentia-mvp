export const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}
