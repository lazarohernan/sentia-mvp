-- Supabase grants EXECUTE to anon by default on new functions; revoke explicitly.
revoke execute on function public.user_organization_ids() from anon;
revoke execute on function public.create_user_organization(text, text, text) from anon;
