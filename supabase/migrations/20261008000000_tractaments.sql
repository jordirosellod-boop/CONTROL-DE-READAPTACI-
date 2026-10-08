-- Tractaments a camilla (fisioteràpia) per jugador. Es pot executar més d'un cop.
create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  injury_id uuid references public.injuries (id) on delete set null,
  data date not null default current_date,
  durada_min smallint check (durada_min between 0 and 300),
  tecniques text[] not null default '{}',
  zones text[] not null default '{}',
  dolor_abans smallint check (dolor_abans between 0 and 10),
  dolor_despres smallint check (dolor_despres between 0 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists treatments_player_idx on public.treatments (player_id, data desc);

alter table public.treatments enable row level security;
drop policy if exists propietari on public.treatments;
create policy propietari on public.treatments for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and public.owns_player(player_id));
