-- ============================================================
-- AI operational triage fields
-- ============================================================

alter table public.ai_analyses
  add column if not exists probable_cause text,
  add column if not exists suggested_owner text,
  add column if not exists suggested_sla text,
  add column if not exists requires_contact boolean;
