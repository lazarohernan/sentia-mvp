revoke all on table public.push_subscriptions from anon;
revoke truncate, references, trigger on table public.push_subscriptions from authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
