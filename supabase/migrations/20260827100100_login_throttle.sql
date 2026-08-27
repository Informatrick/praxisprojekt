-- PROJ-1: per-account login throttle, 5 failed attempts / 15 minutes (AC-13)
-- No client access: RLS enabled without policies; reads/writes only through the
-- security-definer functions below, called from the login server action.
-- Deliberate limitation: anyone holding the anon key can trigger failed attempts —
-- the same effect is reachable through the login form itself, so the RPC adds no
-- new exposure (see design.md, Technische Entscheidungen).

create table public.login_throttle (
  email text primary key,
  failed_count integer not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);

alter table public.login_throttle enable row level security;

-- Returns the time until which the account is locked, or null if not locked.
create function public.login_locked_until(p_email text)
returns timestamptz
language sql
security definer
set search_path = ''
stable
as $$
  select locked_until
  from public.login_throttle
  where email = lower(trim(p_email))
    and locked_until is not null
    and locked_until > now();
$$;

-- Records one failed attempt atomically (single upsert, no read-then-write).
-- Window: 15 minutes. From the 5th failure within the window the account is
-- locked for 15 minutes. Returns the new locked_until (null if not locked).
create function public.record_failed_login(p_email text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locked timestamptz;
begin
  insert into public.login_throttle as t (email, failed_count, window_start, locked_until)
  values (lower(trim(p_email)), 1, now(), null)
  on conflict (email) do update
    set failed_count = case
          when t.window_start < now() - interval '15 minutes' then 1
          else t.failed_count + 1
        end,
        window_start = case
          when t.window_start < now() - interval '15 minutes' then now()
          else t.window_start
        end,
        locked_until = case
          when (case
                  when t.window_start < now() - interval '15 minutes' then 1
                  else t.failed_count + 1
                end) >= 5
          then now() + interval '15 minutes'
          else null
        end
  returning locked_until into v_locked;

  return v_locked;
end;
$$;

-- Successful login clears the counter.
create function public.clear_login_throttle(p_email text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.login_throttle where email = lower(trim(p_email));
$$;
