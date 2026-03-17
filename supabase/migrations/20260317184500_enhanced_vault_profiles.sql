alter table public.user_preferences
add column if not exists encryption_profile text;

alter table public.user_preferences
alter column encryption_iterations set default 210000;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_encryption_profile_supported'
  ) then
    alter table public.user_preferences
    add constraint user_preferences_encryption_profile_supported
    check (
      encryption_profile is null
      or encryption_profile in ('modest', 'standard')
    );
  end if;
end
$$;
