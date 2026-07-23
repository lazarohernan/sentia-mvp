-- Permite registrar consumo de prep de coaching de escucha.

alter table public.ai_usage_events
  drop constraint if exists ai_usage_events_use_case_check;

alter table public.ai_usage_events
  add constraint ai_usage_events_use_case_check
  check (
    use_case in (
      'feedback_triage',
      'operational_report',
      'improvement_narrative',
      'executive_summary',
      'manual_estimate',
      'listening_coaching_prep'
    )
  );
