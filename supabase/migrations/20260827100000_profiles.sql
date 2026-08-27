-- PROJ-1: profiles table, owner-only RLS, signup trigger (AC-8, AC-11)

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 50),
  home_location_name text,
  home_lat double precision,
  home_lon double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a location is stored completely or not at all (design.md: Datenmodell)
  constraint home_location_complete check (
    (home_location_name is null and home_lat is null and home_lon is null)
    or (home_location_name is not null and home_lat is not null and home_lon is not null)
  )
);

alter table public.profiles enable row level security;

-- owner-only access; insert happens via trigger, delete via auth.users cascade
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- every new auth user gets a profile row, no client code involved
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
