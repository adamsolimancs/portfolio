create or replace function public.create_customer_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if
    coalesce(new.raw_user_meta_data ->> 'customer_signup', 'false') <> 'true'
    and coalesce(new.raw_app_meta_data ->> 'provider', '') <> 'google'
  then
    return new;
  end if;

  insert into public."Customer" (
    id,
    email,
    full_name,
    avatar_url,
    provider
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.raw_app_meta_data ->> 'provider'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public."Customer".full_name),
    avatar_url = coalesce(excluded.avatar_url, public."Customer".avatar_url),
    provider = coalesce(excluded.provider, public."Customer".provider),
    updated_at = now();

  return new;
end;
$$;

insert into public."Customer" (
  id,
  email,
  full_name,
  avatar_url,
  provider,
  created_at,
  updated_at
)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture'),
  raw_app_meta_data ->> 'provider',
  created_at,
  now()
from auth.users
where
  coalesce(raw_user_meta_data ->> 'customer_signup', 'false') = 'true'
  or coalesce(raw_app_meta_data ->> 'provider', '') = 'google'
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public."Customer".full_name),
  avatar_url = coalesce(excluded.avatar_url, public."Customer".avatar_url),
  provider = coalesce(excluded.provider, public."Customer".provider),
  updated_at = now();
