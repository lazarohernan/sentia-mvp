-- Snapshot input for improvement narratives (Qualtrics-style: reuse if comments did not change).
alter table public.improvement_narratives
  add column if not exists comment_fingerprint text;
