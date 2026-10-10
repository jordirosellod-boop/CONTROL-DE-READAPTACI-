-- Control de Readaptació · esquema complet
--
-- Pensat per conviure dins d'un projecte de Supabase compartit amb una altra app:
--  * Totes les taules porten el prefix ra_ per no barrejar-se amb les altres.
--  * Només els correus de la llista ra_staff (equip de readaptació) poden fer
--    servir l'app, encara que el projecte tingui altres usuaris.
--  * Tot l'equip comparteix les dades: qualsevol membre veu i edita tots els
--    jugadors (owner_id guarda qui ha creat cada registre).
-- Es pot executar més d'una vegada sense errors.

-- Equip autoritzat (per correu: es pot autoritzar abans que existeixi el compte)
create table if not exists public.ra_staff (
  email text primary key check (email = lower(email)),
  nom text,
  created_at timestamptz not null default now()
);
alter table public.ra_staff enable row level security;
drop policy if exists ra_staff_equip on public.ra_staff;

-- security definer: pot consultar ra_staff tot i l'RLS; només diu sí/no per a l'usuari actual
create or replace function public.ra_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ra_staff where email = lower((select auth.jwt()) ->> 'email'));
$$;
revoke execute on function public.ra_is_staff() from public, anon;
grant execute on function public.ra_is_staff() to authenticated;

create policy ra_staff_equip on public.ra_staff for select to authenticated using ((select public.ra_is_staff()));

-- Taules ---------------------------------------------------------------------
create table if not exists public.ra_players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  nom text not null check (length(trim(nom)) > 0),
  cognoms text not null default '',
  edat smallint check (edat between 5 and 80),
  posicio text check (posicio in ('porter','defensa_central','lateral','migcampista','extrem','davanter','altre')),
  cama_dominant text check (cama_dominant in ('dreta','esquerra','ambidextre')),
  historial_lesions text,
  arxivat boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ra_players_owner_idx on public.ra_players (owner_id);

create table if not exists public.ra_injuries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  player_id uuid not null references public.ra_players (id) on delete cascade,
  diagnostic text not null check (length(trim(diagnostic)) > 0),
  categoria text check (categoria in ('muscular','lligamentosa','tendinosa','ossia','articular','meniscal','altra')),
  zona text,
  costat text check (costat in ('dreta','esquerra','bilateral')),
  data_lesio date not null,
  data_cirurgia date,
  data_alta date,
  activa boolean generated always as (data_alta is null) stored,
  notes text,
  created_at timestamptz not null default now(),
  check (data_cirurgia is null or data_cirurgia >= data_lesio),
  check (data_alta is null or data_alta >= data_lesio)
);
create index if not exists ra_injuries_player_idx on public.ra_injuries (player_id, data_lesio desc);

create table if not exists public.ra_wellness_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  player_id uuid not null references public.ra_players (id) on delete cascade,
  data date not null default current_date,
  son_qualitat smallint not null check (son_qualitat between 1 and 5),
  son_hores numeric(3,1) check (son_hores between 0 and 24),
  fatiga smallint not null check (fatiga between 1 and 5),
  estres smallint not null check (estres between 1 and 5),
  estat_anim smallint not null check (estat_anim between 1 and 5),
  dolor_eva smallint not null default 0 check (dolor_eva between 0 and 10),
  dolor_zones text[] not null default '{}',
  recuperacio smallint not null check (recuperacio between 1 and 5),
  comentari text,
  created_at timestamptz not null default now(),
  unique (player_id, data)
);
create index if not exists ra_wellness_player_idx on public.ra_wellness_entries (player_id, data desc);

create table if not exists public.ra_exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  nom text not null check (length(trim(nom)) > 0),
  categoria text,
  video_url text,
  descripcio text,
  created_at timestamptz not null default now()
);
create index if not exists ra_exercises_owner_idx on public.ra_exercises (owner_id, nom);

create table if not exists public.ra_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  player_id uuid not null references public.ra_players (id) on delete cascade,
  injury_id uuid references public.ra_injuries (id) on delete set null,
  data date not null default current_date,
  nom text,
  completada boolean not null default false,
  rpe numeric(3,1) check (rpe between 1 and 10),
  durada_min smallint check (durada_min between 0 and 600),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists ra_sessions_player_idx on public.ra_sessions (player_id, data desc);

create table if not exists public.ra_session_exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  session_id uuid not null references public.ra_sessions (id) on delete cascade,
  exercise_id uuid references public.ra_exercises (id) on delete set null,
  ordre smallint not null default 0,
  nom text not null check (length(trim(nom)) > 0),
  video_url text,
  series smallint check (series between 0 and 100),
  repeticions smallint check (repeticions between 0 and 1000),
  temps_s integer check (temps_s between 0 and 86400),
  carrega text,
  descans_s integer check (descans_s between 0 and 86400),
  rpe numeric(3,1) check (rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists ra_session_exercises_session_idx on public.ra_session_exercises (session_id, ordre);

create table if not exists public.ra_field_work (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  session_id uuid not null unique references public.ra_sessions (id) on delete cascade,
  minuts_carrera numeric(5,1) check (minuts_carrera >= 0),
  distancia_m integer check (distancia_m >= 0),
  vel_max_kmh numeric(4,1) check (vel_max_kmh between 0 and 50),
  vel_mitjana_kmh numeric(4,1) check (vel_mitjana_kmh between 0 and 50),
  esprints smallint check (esprints >= 0),
  acceleracions smallint check (acceleracions >= 0),
  desacceleracions smallint check (desacceleracions >= 0),
  canvis_direccio smallint check (canvis_direccio >= 0),
  tipus_treball text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ra_tests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  player_id uuid not null references public.ra_players (id) on delete cascade,
  injury_id uuid references public.ra_injuries (id) on delete set null,
  tipus text not null check (tipus in ('forca','mobilitat','cmj','hop','isometric','especific')),
  nom text not null check (length(trim(nom)) > 0),
  unitat text,
  costat text not null default 'bilateral' check (costat in ('lesionat','sa','bilateral')),
  valor numeric not null,
  millor_si text not null default 'mes' check (millor_si in ('mes','menys')),
  data date not null default current_date,
  es_baseline boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists ra_tests_player_idx on public.ra_tests (player_id, nom, data);

create table if not exists public.ra_treatments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users (id) on delete set null, -- qui ho va crear
  player_id uuid not null references public.ra_players (id) on delete cascade,
  injury_id uuid references public.ra_injuries (id) on delete set null,
  data date not null default current_date,
  durada_min smallint check (durada_min between 0 and 300),
  tecniques text[] not null default '{}',
  zones text[] not null default '{}',
  dolor_abans smallint check (dolor_abans between 0 and 10),
  dolor_despres smallint check (dolor_despres between 0 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists ra_treatments_player_idx on public.ra_treatments (player_id, data desc);

-- Seguretat: només l'equip autoritzat, que comparteix totes les dades ---------
do $$
declare t text;
begin
  foreach t in array array['ra_players','ra_exercises','ra_injuries','ra_wellness_entries','ra_sessions',
                           'ra_tests','ra_treatments','ra_session_exercises','ra_field_work'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists propietari on public.%I', t);
    execute format('drop policy if exists equip on public.%I', t);
    execute format('create policy equip on public.%I for all to authenticated
      using ((select public.ra_is_staff())) with check ((select public.ra_is_staff()))', t);
  end loop;
end $$;

-- Permisos de l'API: només usuaris amb sessió (mai anònims); l'RLS limita a l'equip.
-- (Alguns projectes no donen permisos per defecte a les taules noves.)
grant select, insert, update, delete on public.ra_players, public.ra_injuries, public.ra_wellness_entries,
  public.ra_exercises, public.ra_sessions, public.ra_session_exercises, public.ra_field_work,
  public.ra_tests, public.ra_treatments to authenticated;
grant select on public.ra_staff to authenticated;
revoke truncate, trigger, references on public.ra_staff, public.ra_players, public.ra_injuries,
  public.ra_wellness_entries, public.ra_exercises, public.ra_sessions, public.ra_session_exercises,
  public.ra_field_work, public.ra_tests, public.ra_treatments from anon, authenticated;
