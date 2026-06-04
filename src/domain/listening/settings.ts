import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

const timeSchema = z
  .string()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/);

export const listeningWeekdays = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type ListeningWeekday = (typeof listeningWeekdays)[number];

const weekdaySchema = z.enum(listeningWeekdays);

export const updateListeningSettingsInputSchema = z
  .object({
    remindersEnabled: z.boolean(),
    reminderTimes: z.array(timeSchema).max(5).transform((times) => [
      ...new Set(times),
    ]),
    reminderWeekdays: z
      .array(weekdaySchema)
      .min(1)
      .max(7)
      .transform((days) => {
        const selectedDays = new Set(days);
        return listeningWeekdays.filter((weekday) => selectedDays.has(weekday));
      }),
  })
  .superRefine((settings, context) => {
    if (settings.remindersEnabled && settings.reminderTimes.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agrega al menos un horario para activar recordatorios.",
        path: ["reminderTimes"],
      });
    }
  });

export type ListeningSettings = z.infer<typeof updateListeningSettingsInputSchema>;

export const defaultListeningSettings: ListeningSettings = {
  remindersEnabled: false,
  reminderTimes: [],
  reminderWeekdays: ["mon", "tue", "wed", "thu", "fri"],
};

function mapListeningSettingsRow(row: {
  reminders_enabled: boolean;
  reminder_times: string[];
  reminder_weekdays: string[];
}): ListeningSettings {
  const reminderWeekdays = listeningWeekdays.filter((weekday) =>
    row.reminder_weekdays.includes(weekday),
  );

  return {
    remindersEnabled: row.reminders_enabled,
    reminderTimes: row.reminder_times,
    reminderWeekdays:
      reminderWeekdays.length > 0
        ? reminderWeekdays
        : defaultListeningSettings.reminderWeekdays,
  };
}

export async function getListeningSettingsByOrganization(
  client: Client,
  organizationId: string,
): Promise<ListeningSettings> {
  const { data, error } = await client
    .from("organization_listening_settings")
    .select("reminders_enabled, reminder_times, reminder_weekdays")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return defaultListeningSettings;
  }

  return mapListeningSettingsRow(data);
}

export async function updateListeningSettings(
  client: Client,
  params: {
    organizationId: string;
    input: ListeningSettings;
  },
): Promise<ListeningSettings> {
  const { data, error } = await client
    .from("organization_listening_settings")
    .upsert(
      {
        organization_id: params.organizationId,
        reminders_enabled: params.input.remindersEnabled,
        reminder_times: params.input.reminderTimes,
        reminder_weekdays: params.input.reminderWeekdays,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "organization_id" },
    )
    .select("reminders_enabled, reminder_times, reminder_weekdays")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo guardar la configuracion: ${error?.message}`);
  }

  return mapListeningSettingsRow(data);
}
