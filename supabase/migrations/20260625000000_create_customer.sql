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

create table if not exists public."CustomerBilling" (
  customer_id uuid primary key references public."Customer"(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  stripe_product_name text,
  subscription_status text not null default 'inactive',
  monthly_rate_cents integer,
  subscription_started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."CustomerBilling" enable row level security;

create table if not exists public."ServiceRequest" (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public."Customer"(id) on delete cascade,
  service_tier_id text not null,
  title text,
  description text not null,
  priority text not null,
  status text not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists service_request_client_id_idx
  on public."ServiceRequest" (client_id);

create index if not exists service_request_service_tier_id_idx
  on public."ServiceRequest" (service_tier_id);

create index if not exists service_request_created_at_idx
  on public."ServiceRequest" (created_at desc);

create index if not exists service_request_open_created_at_idx
  on public."ServiceRequest" (created_at desc)
  where status <> 'completed';

alter table public."ServiceRequest" enable row level security;

create table if not exists public."AdminUser" (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public."AdminUser" enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public."AdminUser"
    where user_id = (select auth.uid())
  );
$$;

create policy "Customers can read their own row"
  on public."Customer"
  for select
  to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

create policy "Customers can update their own row"
  on public."Customer"
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Customers can read their own billing row"
  on public."CustomerBilling"
  for select
  to authenticated
  using ((select auth.uid()) = customer_id or (select public.is_admin()));

create policy "Customers can read their own service requests"
  on public."ServiceRequest"
  for select
  to authenticated
  using ((select auth.uid()) = client_id or (select public.is_admin()));

create policy "Customers can create their own service requests"
  on public."ServiceRequest"
  for insert
  to authenticated
  with check ((select auth.uid()) = client_id);

create policy "Admins can update service request status"
  on public."ServiceRequest"
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can read their own admin row"
  on public."AdminUser"
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

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

drop trigger if exists set_customer_billing_updated_at on public."CustomerBilling";
create trigger set_customer_billing_updated_at
  before update on public."CustomerBilling"
  for each row execute function public.set_updated_at();

create or replace function public.create_customer_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'customer_signup', 'false') <> 'true' then
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
