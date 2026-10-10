-- Control de Readaptació · esquema complet
--
-- Pensat per conviure dins d'un projecte de Supabase compartit amb una altra app:
--  * Totes les taules porten el prefix ra_ per no barrejar-se amb les altres.
--  * Només els usuaris de la llista ra_staff (readaptadors) poden fer servir l'app,
--    encara que el projecte tingui altres usuaris.
--  * Cada readaptador només veu les seves dades (owner_id = auth.uid()).
-- Es pot executar més d'una vegada sense errors.

-- Llista de readaptadors autoritzats --------------------------------------
create table if not exists public.ra_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.ra_staff enable row level security;
drop policy if exists ra_staff_propi on public.ra_staff;
create policy ra_staff_propi on public.ra_staff for select to authenticated using (user_id = (select auth.uid()));

-- security definer: pot consultar ra_staff tot i l'RLS, però només diu sí/no per a l'usuari actual
create or replace function public.ra_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ra_staff where user_id = (select auth.uid()));
$$;
revoke execute on function public.ra_is_staff() from public, anon;
grant execute on function public.ra_is_staff() to authenticated;

-- Taules ---------------------------------------------------------------------
create table if not exists public.ra_players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nom text not null check (length(trim(nom)) > 0),
  categoria text,
  video_url text,
  descripcio text,
  created_at timestamptz not null default now()
);
create index if not exists ra_exercises_owner_idx on public.ra_exercises (owner_id, nom);

create table if not exists public.ra_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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

-- Seguretat ------------------------------------------------------------------
create or replace function public.ra_owns_player(p uuid) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from public.ra_players where id = p and owner_id = (select auth.uid()));
$$;

create or replace function public.ra_owns_session(s uuid) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from public.ra_sessions where id = s and owner_id = (select auth.uid()));
$$;

do $$
declare t text;
begin
  foreach t in array array['ra_players','ra_exercises'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists propietari on public.%I', t);
    execute format('create policy propietari on public.%I for all to authenticated
      using (owner_id = (select auth.uid()) and (select public.ra_is_staff()))
      with check (owner_id = (select auth.uid()) and (select public.ra_is_staff()))', t);
  end loop;
  foreach t in array array['ra_injuries','ra_wellness_entries','ra_sessions','ra_tests','ra_treatments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists propietari on public.%I', t);
    execute format('create policy propietari on public.%I for all to authenticated
      using (owner_id = (select auth.uid()) and (select public.ra_is_staff()))
      with check (owner_id = (select auth.uid()) and (select public.ra_is_staff()) and public.ra_owns_player(player_id))', t);
  end loop;
  foreach t in array array['ra_session_exercises','ra_field_work'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists propietari on public.%I', t);
    execute format('create policy propietari on public.%I for all to authenticated
      using (owner_id = (select auth.uid()) and (select public.ra_is_staff()))
      with check (owner_id = (select auth.uid()) and (select public.ra_is_staff()) and public.ra_owns_session(session_id))', t);
  end loop;
end $$;
