create table if not exists public."Customer" (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_email_idx on public."Customer" (email);

alter table public."Customer" enable row level security;

create policy "Customers can read their own row"
  on public."Customer"
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Customers can insert their own row"
  on public."Customer"
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Customers can update their own row"
  on public."Customer"
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customer_updated_at on public."Customer";
create trigger set_customer_updated_at
  before update on public."Customer"
  for each row execute function public.set_updated_at();

create or replace function public.create_customer_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_app_meta_data ->> 'provider'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    provider = excluded.provider,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists create_customer_after_auth_user_insert on auth.users;
create trigger create_customer_after_auth_user_insert
  after insert on auth.users
  for each row execute function public.create_customer_for_auth_user();
