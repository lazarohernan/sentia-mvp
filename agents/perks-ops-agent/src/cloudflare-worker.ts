import { Agent, callable, routeAgentRequest } from "agents";

import { loadAgentContext } from "./context-loader";
import { loadAgentConfig } from "./config";
import { runPerksOperationalAgent } from "./openai-agent";
import type { AgentOperationalReport, AgentPeriod } from "./types";

type WorkerEnv = {
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  APP_BASE_URL: string;
  AGENT_INTERNAL_TOKEN: string;
  PERKS_OPS_AGENT: DurableObjectNamespace;
};

type PerksOpsState = {
  organizationId: string | null;
  period: AgentPeriod;
  lastReport: AgentOperationalReport | null;
};

export class PerksOpsAgent extends Agent<WorkerEnv, PerksOpsState> {
  initialState: PerksOpsState = {
    organizationId: null,
    period: "30d",
    lastReport: null,
  };

  @callable()
  configure(input: { organizationId: string; period?: AgentPeriod }) {
    this.setState({
      ...this.state,
      organizationId: input.organizationId,
      period: input.period ?? this.state.period,
    });

    return this.state;
  }

  @callable()
  async generateMonthlyReport(input?: {
    organizationId?: string;
    period?: AgentPeriod;
    branchIds?: string[];
  }) {
    const config = loadAgentConfig({
      OPENAI_API_KEY: this.env.OPENAI_API_KEY,
      OPENAI_MODEL: this.env.OPENAI_MODEL,
      APP_BASE_URL: this.env.APP_BASE_URL,
      AGENT_INTERNAL_TOKEN: this.env.AGENT_INTERNAL_TOKEN,
      PERKS_ORGANIZATION_ID: input?.organizationId ?? this.state.organizationId ?? undefined,
      PERKS_PERIOD: input?.period ?? this.state.period,
      PERKS_BRANCH_IDS: input?.branchIds?.join(","),
    });

    if (!config.defaultOrganizationId) {
      throw new Error("Falta organizationId para ejecutar el agente.");
    }

    const context = await loadAgentContext({
      config,
      organizationId: config.defaultOrganizationId,
      branchIds: input?.branchIds,
      period: input?.period ?? this.state.period,
    });

    const report = await runPerksOperationalAgent({ config, context });

    this.setState({
      organizationId: config.defaultOrganizationId,
      period: context.period,
      lastReport: report,
    });

    return report;
  }

  @callable()
  getLastReport() {
    return this.state.lastReport;
  }
}

export default {
  fetch(request: Request, env: WorkerEnv) {
    return routeAgentRequest(request, env) ?? new Response("Not found", { status: 404 });
  },
};
