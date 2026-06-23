type SendTeamInviteEmailParams = {
  to: string;
  fullName: string;
  organizationName: string;
  roleLabel: string;
  inviteLink: string;
  appUrl: string;
};

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeAppUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export async function sendTeamInviteEmail(
  params: SendTeamInviteEmailParams,
): Promise<"sent" | "skipped"> {
  const config = getResendConfig();

  if (!config) {
    return "skipped";
  }

  const appUrl = normalizeAppUrl(params.appUrl);
  const bannerUrl = `${appUrl}/images/email-invite-banner.jpg`;
  const safeName = escapeHtml(params.fullName);
  const safeOrganization = escapeHtml(params.organizationName);
  const safeRole = escapeHtml(params.roleLabel);
  const safeInviteLink = escapeHtml(params.inviteLink);
  const subject = `Invitación a Perks · ${params.organizationName}`;
  const preview = `${params.organizationName} te invitó a activar tu acceso en Perks.`;

  const text = [
    `Hola ${params.fullName},`,
    "",
    `${params.organizationName} te invito a activar tu acceso en Perks.`,
    `Perfil asignado: ${params.roleLabel}`,
    "",
    "Crea tu contraseña desde este enlace:",
    params.inviteLink,
    "",
    "Si no esperabas esta invitacion, puedes ignorar este correo.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f6f1e8;font-family:Arial,Helvetica,sans-serif;color:#10221d;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f1e8;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #eadfce;">
            <tr>
              <td>
                <img src="${bannerUrl}" width="600" height="200" alt="Perks" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 12px;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f513f;">Invitación de acceso</p>
                <h1 style="margin:0;font-size:28px;line-height:1.18;color:#10221d;">Hola ${safeName}</h1>
                <p style="margin:18px 0 0;font-size:16px;line-height:1.65;color:#46524d;">
                  ${safeOrganization} te invitó a Perks. Activa tu cuenta, crea tu contraseña y entra con el perfil asignado.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8f4;border-radius:16px;border:1px solid #e5ecdf;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0;font-size:13px;font-weight:700;color:#6b756f;">Perfil asignado</p>
                      <p style="margin:5px 0 0;font-size:16px;font-weight:700;color:#0f513f;">${safeRole}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;">
                <a href="${safeInviteLink}" style="display:inline-block;background:#0f513f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 22px;border-radius:999px;">Crear contraseña y entrar</a>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 32px 32px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#7b857f;">Si el botón no funciona, abre este enlace en tu navegador:</p>
                <p style="margin:8px 0 0;font-size:12px;line-height:1.55;color:#4b5a54;word-break:break-all;">${safeInviteLink}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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
      html,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error("No se pudo enviar la invitacion por correo.");
  }

  return "sent";
}
