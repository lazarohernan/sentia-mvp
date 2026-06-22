type SendAlertEscalationEmailParams = {
  to: string;
  organizationName: string;
  branchName: string;
  summary: string;
  dashboardUrl: string;
};

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export async function sendAlertEscalationEmail(
  params: SendAlertEscalationEmailParams,
): Promise<"sent" | "skipped"> {
  const config = getResendConfig();

  if (!config) {
    return "skipped";
  }

  const subject = `Alerta escalada · ${params.branchName}`;
  const text = [
    `Se escaló un caso en ${params.organizationName}.`,
    `Sucursal: ${params.branchName}`,
    "",
    params.summary,
    "",
    `Revisar en Perks: ${params.dashboardUrl}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [params.to],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error("No se pudo enviar el correo de escalamiento.");
  }

  return "sent";
}
