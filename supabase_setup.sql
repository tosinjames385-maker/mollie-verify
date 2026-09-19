-- ==============================================================================
-- SUPABASE FULL DATABASE SCHEMA & SEED SCRIPT FOR SOLVERIFY / JUPITER WALLET
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (linked with auth.users)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  x_user_id text unique,
  username text,
  display_name text,
  avatar_url text,
  email text,
  wallet_address text unique,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure last_seen_at column exists if table was created in an earlier migration
alter table public.profiles add column if not exists last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- ------------------------------------------------------------------------------
-- 2. TOKENS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.tokens (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  symbol text not null,
  mint_address text unique not null,
  image_url text,
  description text,
  website text,
  twitter text,
  telegram text,
  discord text,
  circulating_supply text,
  verification_status text default 'unverified', -- 'unverified', 'pending', 'verified'
  organic_activity text default 'low',           -- 'low', 'medium', 'high'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast token lookups
create index if not exists idx_tokens_mint_address on public.tokens(mint_address);
create index if not exists idx_tokens_symbol on public.tokens(symbol);

-- ------------------------------------------------------------------------------
-- 3. TOKEN LIKES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.token_likes (
  id uuid default gen_random_uuid() primary key,
  token_id uuid references public.tokens(id) on delete cascade not null,
  wallet_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (token_id, wallet_address)
);

create index if not exists idx_token_likes_wallet on public.token_likes(wallet_address);
create index if not exists idx_token_likes_token on public.token_likes(token_id);

-- ------------------------------------------------------------------------------
-- 4. VERIFICATION SUBMISSIONS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.verification_submissions (
  id uuid default gen_random_uuid() primary key,
  token_id uuid references public.tokens(id) on delete cascade not null,
  submitter_wallet text not null,
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  submission_type text default 'verification',
  reviewer_wallet text,
  reviewed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_verifications_status on public.verification_submissions(status);
create index if not exists idx_verifications_submitter on public.verification_submissions(submitter_wallet);

-- ------------------------------------------------------------------------------
-- 5. NEWS POSTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.news_posts (
  id uuid default gen_random_uuid() primary key,
  token_id uuid references public.tokens(id) on delete cascade not null,
  url text not null,
  title text,
  description text,
  submitted_by text not null,
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_news_status on public.news_posts(status);

-- ------------------------------------------------------------------------------
-- 6. RISK WARNINGS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.risk_warnings (
  id uuid default gen_random_uuid() primary key,
  token_id uuid references public.tokens(id) on delete cascade not null,
  warning_type text not null,
  severity text default 'medium',
  description text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 7. TRIGGER: AUTO-CREATE / UPDATE PROFILE ON X OAUTH LOGIN
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    x_user_id,
    username,
    display_name,
    avatar_url,
    email,
    updated_at,
    last_seen_at
  )
  values (
    new.id,
    new.raw_user_meta_data->>'provider_id',
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'user_name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.email,
    now(),
    now()
  )
  on conflict (id) do update set
    x_user_id = coalesce(excluded.x_user_id, public.profiles.x_user_id),
    username = coalesce(excluded.username, public.profiles.username),
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    email = coalesce(excluded.email, public.profiles.email),
    updated_at = now(),
    last_seen_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.tokens enable row level security;
alter table public.token_likes enable row level security;
alter table public.verification_submissions enable row level security;
alter table public.news_posts enable row level security;
alter table public.risk_warnings enable row level security;

-- Profiles Policies
drop policy if exists "Public profiles viewable by everyone" on public.profiles;
create policy "Public profiles viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Tokens Policies (Everyone can view, authenticated/admin can edit)
drop policy if exists "Tokens viewable by everyone" on public.tokens;
create policy "Tokens viewable by everyone" on public.tokens for select using (true);

drop policy if exists "Admins/users can insert tokens" on public.tokens;
create policy "Admins/users can insert tokens" on public.tokens for insert with check (true);

drop policy if exists "Admins can update tokens" on public.tokens;
create policy "Admins can update tokens" on public.tokens for update using (true);

-- Likes Policies
drop policy if exists "Likes viewable by everyone" on public.token_likes;
create policy "Likes viewable by everyone" on public.token_likes for select using (true);

drop policy if exists "Anyone can toggle likes" on public.token_likes;
create policy "Anyone can toggle likes" on public.token_likes for insert with check (true);

drop policy if exists "Anyone can remove likes" on public.token_likes;
create policy "Anyone can remove likes" on public.token_likes for delete using (true);

-- Verification Submissions Policies
drop policy if exists "Submissions viewable by everyone" on public.verification_submissions;
create policy "Submissions viewable by everyone" on public.verification_submissions for select using (true);

drop policy if exists "Anyone can submit verification" on public.verification_submissions;
create policy "Anyone can submit verification" on public.verification_submissions for insert with check (true);

drop policy if exists "Admins can update submissions" on public.verification_submissions;
create policy "Admins can update submissions" on public.verification_submissions for update using (true);

-- News Posts Policies
drop policy if exists "News viewable by everyone" on public.news_posts;
create policy "News viewable by everyone" on public.news_posts for select using (true);

drop policy if exists "Anyone can submit news" on public.news_posts;
create policy "Anyone can submit news" on public.news_posts for insert with check (true);

drop policy if exists "Admins can update news" on public.news_posts;
create policy "Admins can update news" on public.news_posts for update using (true);

-- Risk Warnings Policies
drop policy if exists "Warnings viewable by everyone" on public.risk_warnings;
create policy "Warnings viewable by everyone" on public.risk_warnings for select using (true);

-- ------------------------------------------------------------------------------
-- 9. INITIAL DEMO / SEED DATA
-- ------------------------------------------------------------------------------

-- Insert Sample Tokens
insert into public.tokens (id, name, symbol, mint_address, image_url, description, website, twitter, circulating_supply, verification_status, organic_activity)
values
  ('11111111-1111-1111-1111-111111111111', 'Mollie The Runner', 'MOLLIE', 'GPTpump...abc123', 'https://api.dicebear.com/7.x/bottts/svg?seed=MOLLIE', 'Mollie The Runner is a community-driven memecoin on Solana.', 'https://example.com', '@mollierunner', '963,000,000', 'verified', 'high'),
  ('22222222-2222-2222-2222-222222222222', 'SolanaMax', 'SMAX', '7xK...9aP', 'https://api.dicebear.com/7.x/bottts/svg?seed=SMAX', 'High-performance DeFi utility token on Solana.', 'https://solanamax.example.com', '@solanamax', '100,000,000', 'verified', 'high'),
  ('33333333-3333-3333-3333-333333333333', 'CryptoRunner', 'CRUN', 'ABC...xyz789', 'https://api.dicebear.com/7.x/bottts/svg?seed=CRUN', 'Fast and secure blockchain gaming token.', 'https://cryptorunner.example.com', '@cryptorunner', '500,000,000', 'pending', 'medium')
on conflict (mint_address) do update set
  verification_status = excluded.verification_status,
  organic_activity = excluded.organic_activity;

-- Insert Sample Verification Submissions
insert into public.verification_submissions (token_id, submitter_wallet, status, notes)
values
  ('11111111-1111-1111-1111-111111111111', '7xKXtg2CW87d97TXJSD51jxK1234567890abcdef', 'approved', 'Official token verification request.'),
  ('22222222-2222-2222-2222-222222222222', '8yLYug3DX98e08UYKTE62kyL234567890bcdefg', 'approved', 'DeFi metadata submission.'),
  ('33333333-3333-3333-3333-333333333333', '9zMZvh4EY09f19VZLUF73lzM34567890cdefgh', 'pending', 'Community verification submission.')
on conflict do nothing;

-- Insert Sample Risk Warnings
insert into public.risk_warnings (token_id, warning_type, severity, description)
values
  ('11111111-1111-1111-1111-111111111111', 'low_activity', 'low', 'Token shows low organic trading activity on DEXs')
on conflict do nothing;

-- Complete!
