alter table public.organization_listening_settings
  add column if not exists reminder_weekdays text[] not null
  default array['mon', 'tue', 'wed', 'thu', 'fri']::text[];

alter table public.organization_listening_settings
  add constraint organization_listening_settings_reminder_weekdays_check
  check (
    cardinality(reminder_weekdays) between 1 and 7
    and reminder_weekdays <@ array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']::text[]
  );
