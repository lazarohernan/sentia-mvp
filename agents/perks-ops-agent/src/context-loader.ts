import type { AgentConfig } from "./config";
import type { AgentContextSnapshot, AgentPeriod } from "./types";

export async function loadAgentContext(params: {
  config: AgentConfig;
  organizationId: string;
  branchIds?: string[];
  period: AgentPeriod;
}): Promise<AgentContextSnapshot> {
  const response = await fetch(`${params.config.appBaseUrl}/api/agent/context`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${params.config.agentInternalToken}`,
    },
    body: JSON.stringify({
      organizationId: params.organizationId,
      branchIds: params.branchIds,
      period: params.period,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "No se pudo cargar el contexto interno del agente.");
  }

  const body = (await response.json()) as { snapshot: AgentContextSnapshot };
  return body.snapshot;
}
