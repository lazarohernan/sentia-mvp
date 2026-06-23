import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type {
  AlertEscalationSettings,
  OrganizationSettings,
  ReportCadenceSettings,
  UpdateAlertEscalationInput,
  UpdateOrganizationSettingsInput,
  UpdateReportCadenceInput,
} from "./organization-settings-schemas";

type Client = SupabaseClient<Database>;

const LOGO_BUCKET = "organization-logos";
const ALLOWED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

type OrganizationSettingsRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  address: string | null;
  alert_escalation_phone: string | null;
  alert_escalation_email: string | null;
  peak_hours: string | null;
  service_priorities: string | null;
  compensation_policy: string | null;
  follow_up_tone: string | null;
  agent_notes: string | null;
  report_cadence: "weekly" | "monthly" | "both";
  created_at: string;
};

export function mapOrganizationSettingsRow(
  row: OrganizationSettingsRow,
): OrganizationSettings {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    tagline: row.tagline,
    description: row.description,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    websiteUrl: row.website_url,
    address: row.address,
    alertEscalationPhone: row.alert_escalation_phone,
    alertEscalationEmail: row.alert_escalation_email,
    peakHours: row.peak_hours,
    servicePriorities: row.service_priorities,
    compensationPolicy: row.compensation_policy,
    followUpTone: row.follow_up_tone,
    agentNotes: row.agent_notes,
    reportCadence: row.report_cadence ?? "monthly",
    createdAt: row.created_at,
  };
}

export async function getOrganizationSettingsById(
  client: Client,
  organizationId: string,
): Promise<OrganizationSettings | null> {
  const { data, error } = await client
    .from("organizations")
    .select(
      "id, name, slug, logo_url, tagline, description, contact_email, contact_phone, website_url, address, alert_escalation_phone, alert_escalation_email, peak_hours, service_priorities, compensation_policy, follow_up_tone, agent_notes, report_cadence, created_at",
    )
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapOrganizationSettingsRow(data as OrganizationSettingsRow);
}

export async function updateOrganizationSettings(
  client: Client,
  params: {
    organizationId: string;
    input: UpdateOrganizationSettingsInput;
  },
): Promise<OrganizationSettings> {
  const { data, error } = await client
    .from("organizations")
    .update({
      name: params.input.name,
      logo_url: params.input.logoUrl,
      tagline: params.input.tagline,
      description: params.input.description,
      contact_email: params.input.contactEmail,
      contact_phone: params.input.contactPhone,
      website_url: params.input.websiteUrl,
      address: params.input.address,
      peak_hours: params.input.peakHours,
      service_priorities: params.input.servicePriorities,
      compensation_policy: params.input.compensationPolicy,
      follow_up_tone: params.input.followUpTone,
      agent_notes: params.input.agentNotes,
    } as never)
    .eq("id", params.organizationId)
    .select(
      "id, name, slug, logo_url, tagline, description, contact_email, contact_phone, website_url, address, alert_escalation_phone, alert_escalation_email, peak_hours, service_priorities, compensation_policy, follow_up_tone, agent_notes, report_cadence, created_at",
    )
    .single();

  if (error || !data) {
    throw new Error("No se pudo guardar la configuracion del negocio.");
  }

  return mapOrganizationSettingsRow(data as OrganizationSettingsRow);
}

export async function getAlertEscalationSettings(
  client: Client,
  organizationId: string,
): Promise<AlertEscalationSettings | null> {
  const { data, error } = await client
    .from("organizations")
    .select("alert_escalation_phone, alert_escalation_email")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    alert_escalation_phone: string | null;
    alert_escalation_email: string | null;
  };

  return {
    alertEscalationPhone: row.alert_escalation_phone,
    alertEscalationEmail: row.alert_escalation_email,
  };
}

export async function updateAlertEscalation(
  client: Client,
  params: {
    organizationId: string;
    input: UpdateAlertEscalationInput;
  },
): Promise<AlertEscalationSettings> {
  const { data, error } = await client
    .from("organizations")
    .update({
      alert_escalation_phone: params.input.alertEscalationPhone,
      alert_escalation_email: params.input.alertEscalationEmail,
    } as never)
    .eq("id", params.organizationId)
    .select("alert_escalation_phone, alert_escalation_email")
    .single();

  if (error || !data) {
    throw new Error("No se pudo guardar el contacto de escalamiento.");
  }

  const row = data as {
    alert_escalation_phone: string | null;
    alert_escalation_email: string | null;
  };

  return {
    alertEscalationPhone: row.alert_escalation_phone,
    alertEscalationEmail: row.alert_escalation_email,
  };
}

export async function getReportCadenceSettings(
  client: Client,
  organizationId: string,
): Promise<ReportCadenceSettings | null> {
  const { data, error } = await client
    .from("organizations")
    .select("report_cadence")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { report_cadence: "weekly" | "monthly" | "both" | null };

  return {
    reportCadence: row.report_cadence ?? "monthly",
  };
}

export async function updateReportCadence(
  client: Client,
  params: {
    organizationId: string;
    input: UpdateReportCadenceInput;
  },
): Promise<ReportCadenceSettings> {
  const { data, error } = await client
    .from("organizations")
    .update({
      report_cadence: params.input.reportCadence,
    } as never)
    .eq("id", params.organizationId)
    .select("report_cadence")
    .single();

  if (error || !data) {
    throw new Error("No se pudo guardar la cadencia del informe.");
  }

  const row = data as { report_cadence: "weekly" | "monthly" | "both" };

  return {
    reportCadence: row.report_cadence,
  };
}

function getLogoExtension(file: File) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export async function uploadOrganizationLogo(
  client: Client,
  params: {
    organizationId: string;
    file: File;
  },
): Promise<string> {
  if (!ALLOWED_LOGO_TYPES.has(params.file.type)) {
    throw new Error("Formato de logo no soportado. Usa JPG, PNG o WEBP.");
  }

  if (params.file.size > MAX_LOGO_BYTES) {
    throw new Error("El logo debe pesar menos de 2 MB.");
  }

  const extension = getLogoExtension(params.file);
  if (!extension) {
    throw new Error("Formato de logo no soportado. Usa JPG, PNG o WEBP.");
  }

  const path = `${params.organizationId}/logo.${extension}`;
  const { error: uploadError } = await client.storage
    .from(LOGO_BUCKET)
    .upload(path, params.file, {
      upsert: true,
      contentType: params.file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error("No se pudo subir el logo.");
  }

  const { data } = client.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const logoUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await client
    .from("organizations")
    .update({ logo_url: logoUrl } as never)
    .eq("id", params.organizationId);

  if (updateError) {
    throw new Error("No se pudo guardar el logo.");
  }

  return logoUrl;
}
