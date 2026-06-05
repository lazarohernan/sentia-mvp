-- Store adaptive feedback quality signals for monthly reports and follow-up capture.

alter table public.ai_analyses
  add column if not exists information_quality text
    check (information_quality in ('sufficient', 'partial', 'insufficient')),
  add column if not exists follow_up_question text
    check (follow_up_question is null or char_length(follow_up_question) between 1 and 180),
  add column if not exists follow_up_answer text
    check (follow_up_answer is null or char_length(follow_up_answer) between 1 and 700);

create index if not exists ai_analyses_information_quality_idx
  on public.ai_analyses (information_quality);
