import "dotenv/config";

import { z } from "zod";

import type { AgentPeriod } from "./types";

const agentConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4-mini"),
  APP_BASE_URL: z.string().url(),
  AGENT_INTERNAL_TOKEN: z.string().min(1),
  PERKS_ORGANIZATION_ID: z.string().uuid().optional(),
  PERKS_BRANCH_IDS: z.string().optional(),
  PERKS_PERIOD: z.enum(["7d", "30d"]).optional(),
});

export type AgentConfig = {
  openAiApiKey: string;
  openAiModel: string;
  appBaseUrl: string;
  agentInternalToken: string;
  defaultOrganizationId?: string;
  defaultBranchIds?: string[];
  defaultPeriod: AgentPeriod;
};

export function loadAgentConfig(env: Record<string, string | undefined> = process.env): AgentConfig {
  const parsed = agentConfigSchema.parse(env);

  return {
    openAiApiKey: parsed.OPENAI_API_KEY,
    openAiModel: parsed.OPENAI_MODEL,
    appBaseUrl: parsed.APP_BASE_URL,
    agentInternalToken: parsed.AGENT_INTERNAL_TOKEN,
    defaultOrganizationId: parsed.PERKS_ORGANIZATION_ID,
    defaultBranchIds: parsed.PERKS_BRANCH_IDS
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    defaultPeriod: parsed.PERKS_PERIOD ?? "30d",
  };
}
