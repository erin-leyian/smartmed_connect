-- 1. PROFILES
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('patient', 'pharmacy_admin', 'system_admin')),
  created_at timestamptz default now()
);

-- 2. PHARMACIES
create table pharmacies (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id) on delete set null,
  name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  phone text,
  license_number text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz default now()
);

-- 3. MEDICINES
create table medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  created_at timestamptz default now()
);

-- 4. INVENTORY
create table inventory (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid references pharmacies(id) on delete cascade,
  medicine_id uuid references medicines(id) on delete cascade,
  price numeric(10, 2) not null,
  quantity integer not null default 0,
  updated_at timestamptz default now(),
  unique (pharmacy_id, medicine_id)
);

-- 5. VERIFICATION_REQUESTS
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

-- Profiles: a user can read/update only their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile on signup"
  on profiles for insert
  with check (auth.uid() = id);

-- Pharmacies: anyone can view verified pharmacies (public search);
-- pharmacy admins can view/edit their own pharmacy regardless of status
create policy "Anyone can view verified pharmacies"
  on pharmacies for select
  using (verification_status = 'verified');

create policy "Admins can view own pharmacy"
  on pharmacies for select
  using (auth.uid() = admin_id);

create policy "Admins can update own pharmacy"
  on pharmacies for update
  using (auth.uid() = admin_id);

create policy "Admins can insert their pharmacy"
  on pharmacies for insert
  with check (auth.uid() = admin_id);

-- Medicines: readable by everyone (it's just a catalog, no sensitive data)
create policy "Anyone can view medicines"
  on medicines for select
  using (true);

-- Inventory: readable by everyone (needed for public search results),
-- but only the owning pharmacy admin can add/edit/remove stock
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

-- Verification requests: pharmacy admins see their own; system admins see all
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