alter table public.user_preferences
add column if not exists encryption_enabled boolean not null default false,
add column if not exists encryption_salt text,
add column if not exists encryption_key_check text,
add column if not exists encryption_iterations integer not null default 310000;

alter table public.bookmarks
add column if not exists encrypted_payload text,
add column if not exists encryption_version integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_encryption_metadata_complete'
  ) then
    alter table public.user_preferences
    add constraint user_preferences_encryption_metadata_complete
    check (
      not encryption_enabled
      or (
        encryption_salt is not null
        and encryption_key_check is not null
        and encryption_iterations > 0
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookmarks_encrypted_payload_pairing'
  ) then
    alter table public.bookmarks
    add constraint bookmarks_encrypted_payload_pairing
    check (
      (encrypted_payload is null and encryption_version is null)
      or (encrypted_payload is not null and encryption_version is not null)
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookmarks_encryption_version_supported'
  ) then
    alter table public.bookmarks
    add constraint bookmarks_encryption_version_supported
    check (encryption_version is null or encryption_version > 0);
  end if;
end
$$;
