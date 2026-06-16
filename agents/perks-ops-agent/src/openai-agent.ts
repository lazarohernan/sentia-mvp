import type { AgentConfig } from "./config";
import type { AgentOperationalReport } from "../../../src/domain/agent/context";
import { generateOperationalAgentReport } from "../../../src/domain/agent/operational-report";

export async function runPerksOperationalAgent(params: {
  config: AgentConfig;
  context: import("../../../src/domain/agent/context").AgentContextSnapshot;
}): Promise<AgentOperationalReport> {
  return generateOperationalAgentReport({
    config: {
      openAiApiKey: params.config.openAiApiKey,
      openAiModel: params.config.openAiModel,
    },
    context: params.context,
  });
}
