import { NextResponse } from "next/server";

import { triggerListeningSurveyForOrganization } from "@/domain/listening/reminder-trigger";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

type ListeningSettingsRow = {
  organization_id: string;
  reminder_times: string[];
  reminder_weekdays: string[];
};

const weekdayByShortName = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
} as const;

function getCronToken() {
  return (
    process.env.LISTENING_REMINDER_CRON_TOKEN?.trim() ||
    process.env.AGENT_INTERNAL_TOKEN?.trim() ||
    ""
  );
}

function getHondurasNowParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tegucigalpa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const dateKey = `${value("year")}-${value("month")}-${value("day")}`;
  const time = `${value("hour")}:${value("minute")}`;
  const weekdayName = value("weekday") as keyof typeof weekdayByShortName;
  const weekday = weekdayByShortName[weekdayName] ?? "mon";

  return { dateKey, time, weekday };
}

function isAuthorized(request: Request) {
  const token = getCronToken();

  if (!token) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${token}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!hasSupabaseServiceEnv()) {
    return NextResponse.json(
      { error: "Supabase service role no esta configurado." },
      { status: 503 },
    );
  }

  const { dateKey, time, weekday } = getHondurasNowParts();
  const client = createServiceClient();
  const { data, error } = await client
    .from("organization_listening_settings")
    .select("organization_id, reminder_times, reminder_weekdays")
    .eq("reminders_enabled", true)
    .contains("reminder_times", [time])
    .contains("reminder_weekdays", [weekday]);

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar horarios de escucha." },
      { status: 500 },
    );
  }

  const settings = (data ?? []) as ListeningSettingsRow[];
  let createdCount = 0;

  for (const setting of settings) {
    const result = await triggerListeningSurveyForOrganization(client, {
      organizationId: setting.organization_id,
      trigger: "scheduled",
      runId: `scheduled:${setting.organization_id}:${dateKey}:${time}`,
    });
    createdCount += result.createdCount;
  }

  return NextResponse.json({
    status: "ok",
    checkedOrganizations: settings.length,
    createdCount,
    time,
    weekday,
  });
}
