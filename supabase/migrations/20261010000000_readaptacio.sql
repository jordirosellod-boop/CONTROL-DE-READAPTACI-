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

-- Foto, dorsal i equip (plantilla de ceeuropa.cat)
alter table public.ra_players add column if not exists foto_url text;
alter table public.ra_players add column if not exists dorsal smallint check (dorsal between 0 and 99);
alter table public.ra_players add column if not exists equip text;

-- Foto del membre de l'equip per a la pantalla de benvinguda
alter table public.ra_staff add column if not exists foto_url text;

-- Camí de retorn al joc: fase actual (1–5) i data prevista d'alta
alter table public.ra_injuries add column if not exists fase smallint check (fase between 1 and 5);
alter table public.ra_injuries add column if not exists data_prevista date;

-- ---------------------------------------------------------------------------
-- Avisos push
-- ---------------------------------------------------------------------------
-- Configuració privada (claus VAPID i token del cron). Només la llegeix la
-- funció ra-avisos amb la clau de servei; els valors s'insereixen a mà.
create table if not exists public.ra_config (
  clau text primary key,
  valor text not null
);
alter table public.ra_config enable row level security;
revoke all on public.ra_config from anon, authenticated;
grant select, insert, update, delete on public.ra_config to service_role;

-- Subscripcions push de cada dispositiu del staff
create table if not exists public.ra_push_subs (
  endpoint text primary key,
  email text not null check (email = lower(email)),
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.ra_push_subs enable row level security;
drop policy if exists propi on public.ra_push_subs;
create policy propi on public.ra_push_subs for all to authenticated
  using ((select public.ra_is_staff()) and email = lower(auth.jwt() ->> 'email'))
  with check ((select public.ra_is_staff()) and email = lower(auth.jwt() ->> 'email'));
grant select, insert, update, delete on public.ra_push_subs to authenticated, service_role;
grant select on public.ra_staff, public.ra_players, public.ra_injuries, public.ra_wellness_entries to service_role;

-- Cada dia a les 07:00 UTC (8h/9h a Barcelona):
-- create extension if not exists pg_cron; create extension if not exists pg_net;
-- select cron.schedule('ra-avisos-diaris', '0 7 * * *', $$select net.http_post(
--   url := 'https://goloukjoyzfvexslbxpv.supabase.co/functions/v1/ra-avisos',
--   headers := jsonb_build_object('Content-Type','application/json','x-avisos-token',
--     (select valor from public.ra_config where clau='avisos_token')),
--   body := '{}'::jsonb)$$);

-- ---------------------------------------------------------------------------
-- Imatges dels exercicis (substitueixen el vídeo)
-- ---------------------------------------------------------------------------
alter table public.ra_exercises add column if not exists imatge_url text;
alter table public.ra_session_exercises add column if not exists imatge_url text;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ra-imatges', 'ra-imatges', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "ra imatges pujar" on storage.objects;
create policy "ra imatges pujar" on storage.objects for insert to authenticated
  with check (bucket_id = 'ra-imatges' and (select public.ra_is_staff()));
drop policy if exists "ra imatges llegir" on storage.objects;
create policy "ra imatges llegir" on storage.objects for select to authenticated
  using (bucket_id = 'ra-imatges' and (select public.ra_is_staff()));
drop policy if exists "ra imatges esborrar" on storage.objects;
create policy "ra imatges esborrar" on storage.objects for delete to authenticated
  using (bucket_id = 'ra-imatges' and (select public.ra_is_staff()));

-- ---------------------------------------------------------------------------
-- Formulari diari dels jugadors (un sol enllaç per a tot l'equip, sense comptes)
-- ---------------------------------------------------------------------------
-- El jugador obre l'enllaç, tria el seu nom i envia el wellness d'avui o l'RPE.
-- L'enllaç porta un codi secret desat a ra_config; el staff el pot canviar.
create or replace function public.ra_formulari_token(p_nou boolean default false) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare t text;
begin
  if not public.ra_is_staff() then raise exception 'no autoritzat'; end if;
  select valor into t from public.ra_config where clau = 'formulari_token';
  if t is null or p_nou then
    t := translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_');
    insert into public.ra_config (clau, valor) values ('formulari_token', t)
    on conflict (clau) do update set valor = excluded.valor;
  end if;
  return t;
end $$;

create or replace function public.ra_form_ok(p_token text) returns boolean
language sql security definer set search_path = public stable as $$
  select p_token is not null and length(p_token) >= 24 and exists (select 1 from public.ra_config where clau = 'formulari_token' and valor = p_token)
$$;

create or replace function public.ra_form_info(p_token text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare avui date := (now() at time zone 'Europe/Madrid')::date;
begin
  if not public.ra_form_ok(p_token) then return null; end if;
  return jsonb_build_object('avui', avui, 'jugadors', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', j.id, 'nom', j.nom, 'cognoms', j.cognoms, 'dorsal', j.dorsal,
      'wellness_avui', exists (select 1 from public.ra_wellness_entries w where w.player_id = j.id and w.data = avui),
      'sessions', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'data', s.data, 'nom', s.nom, 'durada_min', s.durada_min) order by s.data desc, s.created_at desc)
        from public.ra_sessions s where s.player_id = j.id and s.rpe is null and s.data between avui - 3 and avui), '[]'::jsonb)
    ) order by j.nom, j.cognoms) from public.ra_players j where not j.arxivat), '[]'::jsonb));
end $$;

create or replace function public.ra_form_wellness(p_token text, p_player uuid, p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare avui date := (now() at time zone 'Europe/Madrid')::date;
begin
  if not public.ra_form_ok(p_token) then raise exception 'enllac'; end if;
  if not exists (select 1 from public.ra_players where id = p_player and not arxivat) then raise exception 'jugador'; end if;
  insert into public.ra_wellness_entries (player_id, data, son_qualitat, son_hores, fatiga, estres, estat_anim, recuperacio, dolor_eva, dolor_zones, comentari)
  values (p_player, avui, (p->>'son_qualitat')::smallint, nullif(p->>'son_hores','')::numeric, (p->>'fatiga')::smallint, (p->>'estres')::smallint,
          (p->>'estat_anim')::smallint, (p->>'recuperacio')::smallint, coalesce((p->>'dolor_eva')::smallint, 0),
          coalesce(array(select jsonb_array_elements_text(p->'dolor_zones')), '{}'), left(nullif(p->>'comentari',''), 1000))
  on conflict (player_id, data) do update set son_qualitat = excluded.son_qualitat, son_hores = excluded.son_hores, fatiga = excluded.fatiga,
    estres = excluded.estres, estat_anim = excluded.estat_anim, recuperacio = excluded.recuperacio, dolor_eva = excluded.dolor_eva,
    dolor_zones = excluded.dolor_zones, comentari = excluded.comentari;
  return 'ok';
end $$;

create or replace function public.ra_form_rpe(p_token text, p_player uuid, p_session uuid, p_rpe numeric, p_durada int) returns text
language plpgsql security definer set search_path = public as $$
declare avui date := (now() at time zone 'Europe/Madrid')::date;
begin
  if not public.ra_form_ok(p_token) then raise exception 'enllac'; end if;
  if not exists (select 1 from public.ra_players where id = p_player and not arxivat) then raise exception 'jugador'; end if;
  if p_rpe is null or p_rpe < 1 or p_rpe > 10 then raise exception 'rpe'; end if;
  if p_session is null then
    insert into public.ra_sessions (player_id, injury_id, data, nom, completada, rpe, durada_min)
    values (p_player, (select id from public.ra_injuries where player_id = p_player and data_alta is null order by data_lesio desc limit 1),
            avui, 'Entrenament (registrat pel jugador)', true, p_rpe, p_durada);
  else
    update public.ra_sessions set rpe = p_rpe, durada_min = coalesce(p_durada, durada_min), completada = true
    where id = p_session and player_id = p_player and data between avui - 3 and avui;
    if not found then raise exception 'sessio'; end if;
  end if;
  return 'ok';
end $$;

revoke all on function public.ra_formulari_token(boolean) from public;
revoke all on function public.ra_form_ok(text) from public;
revoke all on function public.ra_form_info(text) from public;
revoke all on function public.ra_form_wellness(text, uuid, jsonb) from public;
revoke all on function public.ra_form_rpe(text, uuid, uuid, numeric, int) from public;
grant execute on function public.ra_formulari_token(boolean) to authenticated;
grant execute on function public.ra_form_info(text) to anon, authenticated;
grant execute on function public.ra_form_wellness(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.ra_form_rpe(text, uuid, uuid, numeric, int) to anon, authenticated;
