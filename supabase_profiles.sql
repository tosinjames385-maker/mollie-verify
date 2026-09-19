-- Supabase Profiles Table Migration
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

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

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

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
