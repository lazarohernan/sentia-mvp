-- ============================================================
-- Organization operational knowledge for agent context
-- ============================================================

alter table public.organizations
  add column if not exists peak_hours text,
  add column if not exists service_priorities text,
  add column if not exists compensation_policy text,
  add column if not exists follow_up_tone text,
  add column if not exists agent_notes text;
