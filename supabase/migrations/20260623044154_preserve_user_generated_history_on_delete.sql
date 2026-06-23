-- Preserve operational history when an invited/team user is deleted from Auth.
-- Personal access/profile data can be removed, while generated records remain
-- visible as "Usuario eliminado" / "Equipo".

alter table public.listening_events
  drop constraint if exists listening_events_user_id_fkey;

alter table public.listening_events
  alter column user_id drop not null;

alter table public.listening_events
  add constraint listening_events_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete set null;

alter table public.feedback_follow_up_actions
  drop constraint if exists feedback_follow_up_actions_actor_user_id_fkey;

alter table public.feedback_follow_up_actions
  alter column actor_user_id drop not null;

alter table public.feedback_follow_up_actions
  add constraint feedback_follow_up_actions_actor_user_id_fkey
  foreign key (actor_user_id)
  references public.profiles(id)
  on delete set null;

delete from public.push_subscriptions ps
where not exists (
  select 1
  from public.profiles p
  where p.id = ps.user_id
);

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_user_id_fkey;

alter table public.push_subscriptions
  add constraint push_subscriptions_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
