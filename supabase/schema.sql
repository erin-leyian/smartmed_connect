-- 1. TABLES

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('patient', 'pharmacy_admin', 'system_admin')),
  created_at timestamptz default now()
);

create table pharmacies (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id) on delete set null,
  name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  phone text,
  license_number text not null,
  contact_email text,
  contact_email_verified boolean not null default false,
  contact_email_code text,
  contact_email_code_expires_at timestamptz,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz default now()
);

create table medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  created_at timestamptz default now()
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid references pharmacies(id) on delete cascade,
  medicine_id uuid references medicines(id) on delete cascade,
  price numeric(10, 2) not null,
  quantity integer not null default 0,
  updated_at timestamptz default now(),
  unique (pharmacy_id, medicine_id)
);

create table verification_requests (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid references pharmacies(id) on delete cascade,
  submitted_at timestamptz default now(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  notes text
);

-- 2. ROW LEVEL SECURITY

alter table profiles enable row level security;
alter table pharmacies enable row level security;
alter table medicines enable row level security;
alter table inventory enable row level security;
alter table verification_requests enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Note: no manual "insert own profile" policy is needed — profiles are
-- created automatically by the handle_new_user() trigger below, which
-- runs with elevated privileges and bypasses RLS.

create policy "Anyone can view verified pharmacies"
  on pharmacies for select
  using (verification_status = 'verified');

create policy "Admins can view own pharmacy"
  on pharmacies for select
  using (auth.uid() = admin_id);

create policy "System admins view all pharmacies"
  on pharmacies for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'system_admin'
    )
  );

create policy "Admins can update own pharmacy"
  on pharmacies for update
  using (auth.uid() = admin_id);

create policy "System admins update pharmacy verification"
  on pharmacies for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'system_admin'
    )
  );

create policy "Admins can insert their pharmacy"
  on pharmacies for insert
  with check (auth.uid() = admin_id);

create policy "Anyone can view medicines"
  on medicines for select
  using (true);

create policy "Anyone can view inventory"
  on inventory for select
  using (true);

create policy "Pharmacy admins manage own inventory"
  on inventory for all
  using (
    exists (
      select 1 from pharmacies
      where pharmacies.id = inventory.pharmacy_id
      and pharmacies.admin_id = auth.uid()
    )
  );

create policy "Pharmacy admins view own verification requests"
  on verification_requests for select
  using (
    exists (
      select 1 from pharmacies
      where pharmacies.id = verification_requests.pharmacy_id
      and pharmacies.admin_id = auth.uid()
    )
  );

create policy "System admins view all verification requests"
  on verification_requests for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'system_admin'
    )
  );

create policy "System admins update verification requests"
  on verification_requests for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'system_admin'
    )
  );

create policy "Pharmacy admins submit verification requests"
  on verification_requests for insert
  with check (
    exists (
      select 1 from pharmacies
      where pharmacies.id = verification_requests.pharmacy_id
      and pharmacies.admin_id = auth.uid()
    )
  );

-- 3. SIGNUP TRIGGER

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. PHARMACY REGISTRATION FUNCTION


create or replace function public.register_pharmacy(
  p_admin_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_license_number text,
  p_contact_email text,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pharmacy_id uuid;
begin
  insert into public.pharmacies (
    admin_id, name, address, phone, license_number, contact_email, latitude, longitude
  )
  values (
    p_admin_id, p_name, p_address, p_phone, p_license_number, p_contact_email, p_latitude, p_longitude
  )
  returning id into v_pharmacy_id;

  insert into public.verification_requests (pharmacy_id)
  values (v_pharmacy_id);

  return v_pharmacy_id;
end;
$$;

grant execute on function public.register_pharmacy to anon, authenticated;


-- 5. SYSTEM ADMIN ACCOUNT (manual step — not run as SQL)

-- 1. Supabase Dashboard -> Authentication -> Users -> Add user
--    Enter an email/password, toggle "Auto Confirm User" on.
-- 2. Copy the new user's UUID.
-- 3. Run:
--    insert into profiles (id, full_name, role)
--    values ('paste-uuid-here', 'System Administrator', 'system_admin');