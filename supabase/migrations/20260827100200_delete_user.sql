-- PROJ-1: self-service account deletion (AC-15)
-- Security-definer function: a logged-in user deletes exactly their own
-- auth.users row; profiles (and later activities) follow via FK cascade.
-- No service-role key in the app this way (see design.md, Technische Entscheidungen).

create function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_user() from public;
revoke execute on function public.delete_user() from anon;
grant execute on function public.delete_user() to authenticated;
