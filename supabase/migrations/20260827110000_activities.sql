-- PROJ-2: activities table — Aktivitäten mit Wetterbedingungen
-- Owner-only RLS für alle vier Operationen; Kaskade bei Kontolöschung (AC-12).

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  temp_min integer,
  temp_max integer,
  no_rain boolean not null default false,
  wind_max numeric,
  time_from time,
  time_to time,
  -- Wochentage als ISO-Zahlen 1..7 (1 = Montag … 7 = Sonntag)
  weekdays smallint[] not null default '{1,2,3,4,5,6,7}',
  location_name text,
  location_lat double precision,
  location_lon double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- AC-1/AC-2: Name 1..80 Zeichen
  constraint activities_name_len check (char_length(name) between 1 and 80),
  -- AC-3: mindestens eine Wetterbedingung
  constraint activities_at_least_one_condition check (
    temp_min is not null
    or temp_max is not null
    or no_rain = true
    or wind_max is not null
  ),
  -- AC-4: plausible Temperaturbereiche, min < max wenn beide gesetzt
  constraint activities_temp_min_range check (temp_min is null or temp_min between -50 and 60),
  constraint activities_temp_max_range check (temp_max is null or temp_max between -50 and 60),
  constraint activities_temp_order check (
    temp_min is null or temp_max is null or temp_min < temp_max
  ),
  -- AC-4: Wind nicht negativ
  constraint activities_wind_nonneg check (wind_max is null or wind_max >= 0),
  -- AC-5: Zeitfenster von < bis wenn beide gesetzt (kein Mitternachtssprung)
  constraint activities_time_order check (
    time_from is null or time_to is null or time_from < time_to
  ),
  -- AC-6: mindestens ein Wochentag, alle Werte 1..7
  constraint activities_weekdays_nonempty check (array_length(weekdays, 1) >= 1),
  constraint activities_weekdays_range check (
    weekdays <@ array[1,2,3,4,5,6,7]::smallint[]
  ),
  -- Standort vollständig oder gar nicht
  constraint activities_location_complete check (
    (location_name is null and location_lat is null and location_lon is null)
    or (location_name is not null and location_lat is not null and location_lon is not null)
  )
);

-- AC-8: schnelle Liste der eigenen Aktivitäten
create index activities_user_id_idx on public.activities (user_id);

alter table public.activities enable row level security;

-- Owner-only für alle vier Operationen (der Client legt an und löscht direkt)
create policy "activities_select_own"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "activities_insert_own"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "activities_update_own"
  on public.activities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "activities_delete_own"
  on public.activities for delete
  using (auth.uid() = user_id);

-- updated_at pflegen (Funktion existiert aus PROJ-1)
create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();
