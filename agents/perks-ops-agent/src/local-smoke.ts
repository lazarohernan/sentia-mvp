import { loadAgentConfig } from "./config";
import { loadAgentContext } from "./context-loader";
import { runPerksOperationalAgent } from "./openai-agent";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function main() {
  const config = loadAgentConfig();
  const organizationId = getArg("--organization") ?? config.defaultOrganizationId;
  const period = (getArg("--period") as "7d" | "30d" | undefined) ?? config.defaultPeriod;
  const branchIds = (getArg("--branches") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!organizationId) {
    throw new Error("Usa --organization o define PERKS_ORGANIZATION_ID.");
  }

  const context = await loadAgentContext({
    config,
    organizationId,
    branchIds: branchIds.length > 0 ? branchIds : config.defaultBranchIds,
    period,
  });

  const report = await runPerksOperationalAgent({ config, context });
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
