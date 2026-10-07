-- Control de Readaptació: esquema inicial
--
-- Només els readaptadors (usuaris de Supabase Auth) tenen accés a l'aplicació.
-- Els jugadors són registres de dades, no usuaris. Cada readaptador només veu
-- i modifica les seves pròpies dades (owner_id = auth.uid()), garantit per RLS.

-- ---------------------------------------------------------------------------
-- Jugadors
-- ---------------------------------------------------------------------------
create table public.players (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nom                text not null check (length(trim(nom)) > 0),
  cognoms            text not null default '',
  edat               smallint check (edat between 5 and 80),
  posicio            text check (posicio in ('porter', 'defensa_central', 'lateral', 'migcampista', 'extrem', 'davanter', 'altre')),
  cama_dominant      text check (cama_dominant in ('dreta', 'esquerra', 'ambidextre')),
  historial_lesions  text,          -- historial previ en text lliure (lesions anteriors a l'app)
  arxivat            boolean not null default false,
  created_at         timestamptz not null default now()
);
create index players_owner_idx on public.players (owner_id);

-- ---------------------------------------------------------------------------
-- Lesions (la lesió activa és la que no té data d'alta)
-- ---------------------------------------------------------------------------
create table public.injuries (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_id      uuid not null references public.players (id) on delete cascade,
  diagnostic     text not null check (length(trim(diagnostic)) > 0),
  categoria      text check (categoria in ('muscular', 'lligamentosa', 'tendinosa', 'ossia', 'articular', 'meniscal', 'altra')),
  zona           text,
  costat         text check (costat in ('dreta', 'esquerra', 'bilateral')),
  data_lesio     date not null,
  data_cirurgia  date,
  data_alta      date,
  activa         boolean generated always as (data_alta is null) stored,
  notes          text,
  created_at     timestamptz not null default now(),
  check (data_cirurgia is null or data_cirurgia >= data_lesio),
  check (data_alta is null or data_alta >= data_lesio)
);
create index injuries_player_idx on public.injuries (player_id, data_lesio desc);

-- ---------------------------------------------------------------------------
-- Wellness diari (una entrada per jugador i dia)
-- Escales 1–5: 5 sempre és el millor estat (p. ex. fatiga 5 = molt fresc).
-- ---------------------------------------------------------------------------
create table public.wellness_entries (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_id     uuid not null references public.players (id) on delete cascade,
  data          date not null default current_date,
  son_qualitat  smallint not null check (son_qualitat between 1 and 5),
  son_hores     numeric(3, 1) check (son_hores between 0 and 24),
  fatiga        smallint not null check (fatiga between 1 and 5),
  estres        smallint not null check (estres between 1 and 5),
  estat_anim    smallint not null check (estat_anim between 1 and 5),
  dolor_eva     smallint not null default 0 check (dolor_eva between 0 and 10),
  dolor_zones   text[] not null default '{}',
  recuperacio   smallint not null check (recuperacio between 1 and 5),
  comentari     text,
  created_at    timestamptz not null default now(),
  unique (player_id, data)
);
create index wellness_player_idx on public.wellness_entries (player_id, data desc);

-- ---------------------------------------------------------------------------
-- Biblioteca d'exercicis (reutilitzable entre sessions)
-- ---------------------------------------------------------------------------
create table public.exercises (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nom         text not null check (length(trim(nom)) > 0),
  categoria   text,
  video_url   text,
  descripcio  text,
  created_at  timestamptz not null default now()
);
create index exercises_owner_idx on public.exercises (owner_id, nom);

-- ---------------------------------------------------------------------------
-- Sessions de readaptació
-- ---------------------------------------------------------------------------
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_id   uuid not null references public.players (id) on delete cascade,
  injury_id   uuid references public.injuries (id) on delete set null,
  data        date not null default current_date,
  nom         text,
  completada  boolean not null default false,
  rpe         numeric(3, 1) check (rpe between 1 and 10),     -- RPE de sessió (Borg CR-10)
  durada_min  smallint check (durada_min between 0 and 600),
  notes       text,
  created_at  timestamptz not null default now()
);
create index sessions_player_idx on public.sessions (player_id, data desc);

create table public.session_exercises (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id   uuid not null references public.sessions (id) on delete cascade,
  exercise_id  uuid references public.exercises (id) on delete set null,
  ordre        smallint not null default 0,
  nom          text not null check (length(trim(nom)) > 0),  -- còpia del nom per conservar l'històric
  video_url    text,
  series       smallint check (series between 0 and 100),
  repeticions  smallint check (repeticions between 0 and 1000),
  temps_s      integer check (temps_s between 0 and 86400),
  carrega      text,                                           -- "40 kg", "banda vermella", "PC"...
  descans_s    integer check (descans_s between 0 and 86400),
  rpe          numeric(3, 1) check (rpe between 1 and 10),
  notes        text,
  created_at   timestamptz not null default now()
);
create index session_exercises_session_idx on public.session_exercises (session_id, ordre);

-- ---------------------------------------------------------------------------
-- Carrera i treball de camp (un registre per sessió)
-- ---------------------------------------------------------------------------
create table public.field_work (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id        uuid not null unique references public.sessions (id) on delete cascade,
  minuts_carrera    numeric(5, 1) check (minuts_carrera >= 0),
  distancia_m       integer check (distancia_m >= 0),
  vel_max_kmh       numeric(4, 1) check (vel_max_kmh between 0 and 50),
  vel_mitjana_kmh   numeric(4, 1) check (vel_mitjana_kmh between 0 and 50),
  esprints          smallint check (esprints >= 0),
  acceleracions     smallint check (acceleracions >= 0),
  desacceleracions  smallint check (desacceleracions >= 0),
  canvis_direccio   smallint check (canvis_direccio >= 0),
  tipus_treball     text,
  notes             text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tests físics
-- Comparativa: es compara cada valor amb el baseline (pre-lesió) del mateix
-- test i costat. LSI = costat lesionat / costat sa del mateix dia.
-- ---------------------------------------------------------------------------
create table public.tests (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_id    uuid not null references public.players (id) on delete cascade,
  injury_id    uuid references public.injuries (id) on delete set null,
  tipus        text not null check (tipus in ('forca', 'mobilitat', 'cmj', 'hop', 'isometric', 'especific')),
  nom          text not null check (length(trim(nom)) > 0),
  unitat       text,
  costat       text not null default 'bilateral' check (costat in ('lesionat', 'sa', 'bilateral')),
  valor        numeric not null,
  millor_si    text not null default 'mes' check (millor_si in ('mes', 'menys')),
  data         date not null default current_date,
  es_baseline  boolean not null default false,
  notes        text,
  created_at   timestamptz not null default now()
);
create index tests_player_idx on public.tests (player_id, nom, data);

-- ---------------------------------------------------------------------------
-- Seguretat: Row Level Security
-- Cada fila pertany al readaptador que la crea, i les files filles només es
-- poden associar a pares del mateix readaptador.
-- ---------------------------------------------------------------------------
create or replace function public.owns_player(p uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.players where id = p and owner_id = (select auth.uid()));
$$;

create or replace function public.owns_session(s uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.sessions where id = s and owner_id = (select auth.uid()));
$$;

alter table public.players            enable row level security;
alter table public.injuries           enable row level security;
alter table public.wellness_entries   enable row level security;
alter table public.exercises          enable row level security;
alter table public.sessions           enable row level security;
alter table public.session_exercises  enable row level security;
alter table public.field_work         enable row level security;
alter table public.tests              enable row level security;

create policy "propietari" on public.players for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "propietari" on public.exercises for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "propietari" on public.injuries for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and public.owns_player(player_id));

create policy "propietari" on public.wellness_entries for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and public.owns_player(player_id));

create policy "propietari" on public.sessions for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and public.owns_player(player_id));

create policy "propietari" on public.tests for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and public.owns_player(player_id));

create policy "propietari" on public.session_exercises for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and public.owns_session(session_id));

create policy "propietari" on public.field_work for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and public.owns_session(session_id));
