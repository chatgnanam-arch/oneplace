-- Schema snapshot for quick reference.
-- Source of truth: supabase/migrations/*.sql

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'bookmark_source_type'
  ) then
    create type public.bookmark_source_type as enum ('manual', 'catalog');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'workspace_home_view'
  ) then
    create type public.workspace_home_view as enum ('discover', 'my_links');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_email_not_blank check (char_length(trim(email::text)) > 0),
  constraint profiles_display_name_len check (
    display_name is null
    or char_length(trim(display_name)) between 1 and 80
  )
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  icon text not null default 'bookmark',
  color text not null default '#1f8a70',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint collections_name_not_blank check (char_length(trim(name)) > 0),
  constraint collections_sort_order_non_negative check (sort_order >= 0)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_collection_id uuid references public.collections (id) on delete set null,
  home_view public.workspace_home_view not null default 'discover',
  encryption_enabled boolean not null default false,
  encryption_salt text,
  encryption_key_check text,
  encryption_iterations integer not null default 210000,
  encryption_profile text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_preferences_encryption_metadata_complete check (
    not encryption_enabled
    or (
      encryption_salt is not null
      and encryption_key_check is not null
      and encryption_iterations > 0
    )
  ),
  constraint user_preferences_encryption_profile_supported check (
    encryption_profile is null
    or encryption_profile in ('modest', 'standard')
  )
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  title text not null,
  url text not null,
  description text not null default '',
  encrypted_payload text,
  encryption_version integer,
  notes text not null default '',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  source_type public.bookmark_source_type not null default 'manual',
  source_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookmarks_encrypted_payload_pairing check (
    (encrypted_payload is null and encryption_version is null)
    or (encrypted_payload is not null and encryption_version is not null)
  ),
  constraint bookmarks_encryption_version_supported check (
    encryption_version is null or encryption_version > 0
  ),
  constraint bookmarks_title_not_blank check (char_length(trim(title)) > 0),
  constraint bookmarks_url_not_blank check (char_length(trim(url)) > 0)
);

create unique index if not exists collections_user_name_key
on public.collections (user_id, lower(name));

create index if not exists collections_user_sort_idx
on public.collections (user_id, sort_order, created_at);

create index if not exists bookmarks_user_collection_created_idx
on public.bookmarks (user_id, collection_id, created_at desc);

create index if not exists bookmarks_user_favorites_idx
on public.bookmarks (user_id, created_at desc)
where is_favorite;

create unique index if not exists bookmarks_user_collection_source_key_key
on public.bookmarks (user_id, collection_id, source_key)
where source_key is not null;

create index if not exists bookmarks_tags_gin_idx
on public.bookmarks
using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.assert_bookmark_collection_ownership()
returns trigger
language plpgsql
as $$
declare
  collection_owner uuid;
begin
  select user_id
  into collection_owner
  from public.collections
  where id = new.collection_id;

  if collection_owner is null then
    raise exception 'Selected category does not exist.'
      using errcode = '23503';
  end if;

  if collection_owner <> new.user_id then
    raise exception 'Selected category belongs to another user.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.assert_preferences_collection_ownership()
returns trigger
language plpgsql
as $$
declare
  collection_owner uuid;
begin
  if new.default_collection_id is null then
    return new;
  end if;

  select user_id
  into collection_owner
  from public.collections
  where id = new.default_collection_id;

  if collection_owner is null then
    raise exception 'Default category does not exist.'
      using errcode = '23503';
  end if;

  if collection_owner <> new.user_id then
    raise exception 'Default category belongs to another user.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
before update on public.collections
for each row execute procedure public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute procedure public.set_updated_at();

drop trigger if exists bookmarks_set_updated_at on public.bookmarks;
create trigger bookmarks_set_updated_at
before update on public.bookmarks
for each row execute procedure public.set_updated_at();

drop trigger if exists bookmarks_check_collection_ownership on public.bookmarks;
create trigger bookmarks_check_collection_ownership
before insert or update on public.bookmarks
for each row execute procedure public.assert_bookmark_collection_ownership();

drop trigger if exists user_preferences_check_collection_ownership on public.user_preferences;
create trigger user_preferences_check_collection_ownership
before insert or update on public.user_preferences
for each row execute procedure public.assert_preferences_collection_ownership();

drop trigger if exists auth_users_sync_profile on auth.users;
create trigger auth_users_sync_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.sync_profile_from_auth();

insert into public.profiles (id, email, display_name, avatar_url)
select
  users.id,
  coalesce(users.email, ''),
  users.raw_user_meta_data ->> 'display_name',
  users.raw_user_meta_data ->> 'avatar_url'
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  display_name = coalesce(excluded.display_name, public.profiles.display_name),
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

insert into public.user_preferences (user_id)
select users.id
from auth.users as users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.user_preferences enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "collections_select_own" on public.collections;
create policy "collections_select_own"
on public.collections
for select
using (auth.uid() = user_id);

drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own"
on public.collections
for insert
with check (auth.uid() = user_id);

drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own"
on public.collections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own"
on public.collections
for delete
using (auth.uid() = user_id);

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
on public.user_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
on public.user_preferences
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
on public.user_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_preferences_delete_own" on public.user_preferences;
create policy "user_preferences_delete_own"
on public.user_preferences
for delete
using (auth.uid() = user_id);

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
on public.bookmarks
for select
using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
on public.bookmarks
for insert
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
on public.bookmarks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
on public.bookmarks
for delete
using (auth.uid() = user_id);
