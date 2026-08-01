-- Ferguson Storage Portal — Communications module
-- Run this in the Supabase SQL Editor after the initial schema

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'bank', -- bank, trustee, auction, other
  phone text,
  email text,
  active_number text, -- sticky "from" number for this contact's thread
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists comm_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  channel text not null default 'sms', -- sms, email, call
  direction text not null default 'outbound', -- inbound, outbound
  subject text,
  body text,
  status text not null default 'queued', -- queued, sent, delivered, failed, logged
  error_detail text,
  media_url text,
  from_number text,
  to_number text,
  twilio_sid text,
  created_at timestamptz not null default now()
);

create table if not exists comm_templates (
  id uuid primary key default gen_random_uuid(),
  category text default 'general',
  channel text not null default 'sms', -- sms, email, call_script
  name text not null,
  subject text,
  body text not null,
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists comm_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  label text,
  status text not null default 'active', -- active, inactive
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;
alter table comm_messages enable row level security;
alter table comm_templates enable row level security;
alter table comm_phone_numbers enable row level security;

drop policy if exists "authenticated full access" on contacts;
drop policy if exists "authenticated full access" on comm_messages;
drop policy if exists "authenticated full access" on comm_templates;
drop policy if exists "authenticated full access" on comm_phone_numbers;

create policy "authenticated full access" on contacts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on comm_messages for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on comm_templates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on comm_phone_numbers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Enable realtime so the inbox updates live without a refresh
alter publication supabase_realtime add table comm_messages;

-- A couple of starter templates so Templates isn't empty on first load
insert into comm_templates (category, channel, name, subject, body)
values
  ('Bank Outreach', 'sms', 'Asset Secured — Initial Contact', null, 'Hi {{contact_name}}, this is {{sender_name}} with {{company_name}}. We''ve secured one of your assets and sent a full report to your email. Please reach out to arrange payment or delivery.'),
  ('Bank Outreach', 'email', 'Asset Secured Notification', 'Notice of Secured Asset — {{company_name}}', 'Hi {{contact_name}},\n\n{{company_name}} has taken possession of an asset tied to your institution. A full secured-asset report with photos and chain of custody is attached.\n\nPlease contact us to arrange payment or delivery to the nearest auction.\n\n{{sender_name}}\n{{company_name}}')
on conflict do nothing;
