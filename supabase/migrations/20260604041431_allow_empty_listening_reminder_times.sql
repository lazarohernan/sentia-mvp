alter table public.organization_listening_settings
  drop constraint if exists organization_listening_settings_reminder_times_check;

alter table public.organization_listening_settings
  alter column reminder_times set default array[]::text[];

update public.organization_listening_settings
set reminder_times = array[]::text[],
    reminders_enabled = false,
    updated_at = now()
where reminder_times = array['09:00', '13:00', '17:00']::text[];

alter table public.organization_listening_settings
  add constraint organization_listening_settings_reminder_times_check
  check (
    cardinality(reminder_times) between 0 and 5
    and (
      reminders_enabled = false
      or cardinality(reminder_times) between 1 and 5
    )
  );
