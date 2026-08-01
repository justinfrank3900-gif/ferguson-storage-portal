-- Ferguson Storage Portal — initial schema
-- Run this in the Supabase SQL Editor (Database > SQL Editor > New query)

create table if not exists trustees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  firm text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null default 'vehicle', -- vehicle, boat, trailer, other
  make text,
  model text,
  year text,
  vin text,
  trustee_id uuid references trustees(id),
  file_number text,
  pickup_date date,
  pickup_address text,
  condition_notes text,
  lot_location text,
  status text not null default 'in_transit', -- in_transit, in_storage, released, at_auction
  created_at timestamptz not null default now()
);

create table if not exists asset_photos (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists liens (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  registration_number text,
  filed_date date,
  expiry_date date,
  status text not null default 'pending', -- pending, filed, expiring, expired, released
  created_at timestamptz not null default now()
);

create table if not exists bank_outreach (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  bank_name text not null,
  contact_name text,
  contact_email text,
  invoice_sent_date date,
  daily_rate numeric(10,2) default 35.00,
  total_owed numeric(10,2) default 0,
  payment_status text not null default 'invoiced', -- not_sent, invoiced, paid, disputed
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists storage_ledger (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  daily_rate numeric(10,2) default 35.00,
  storage_start date default current_date,
  released_date date,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  name text not null,
  url text,
  doc_type text default 'authorization', -- authorization, insurance, lien, other
  signed boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists auction_network (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  distance_km numeric(6,1),
  delivery_fee numeric(10,2),
  notes text,
  created_at timestamptz not null default now()
);

-- Seed a starting auction network list (placeholder distances/fees — fill in real ones)
insert into auction_network (name, address, distance_km, delivery_fee, notes)
values
  ('Manheim Edmonton', 'Edmonton, AB', null, null, 'Confirm distance and delivery fee'),
  ('ADESA Edmonton', 'Edmonton, AB', null, null, 'Confirm distance and delivery fee'),
  ('Manheim Calgary', 'Calgary, AB', null, null, 'Confirm distance and delivery fee')
on conflict do nothing;

-- Row Level Security — all three team members get full authenticated access
alter table trustees enable row level security;
alter table assets enable row level security;
alter table asset_photos enable row level security;
alter table liens enable row level security;
alter table bank_outreach enable row level security;
alter table storage_ledger enable row level security;
alter table documents enable row level security;
alter table auction_network enable row level security;

create policy "authenticated full access" on trustees for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on assets for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on asset_photos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on liens for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on bank_outreach for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on storage_ledger for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on documents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on auction_network for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage bucket for asset photos and documents
insert into storage.buckets (id, name, public) values ('asset-media', 'asset-media', true)
on conflict (id) do nothing;

create policy "authenticated upload" on storage.objects for insert to authenticated with check (bucket_id = 'asset-media');
create policy "public read" on storage.objects for select using (bucket_id = 'asset-media');
create policy "authenticated delete" on storage.objects for delete to authenticated using (bucket_id = 'asset-media');
