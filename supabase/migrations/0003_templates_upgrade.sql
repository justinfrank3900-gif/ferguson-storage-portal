-- Ferguson Storage Portal — Templates upgrade
-- Run this in the Supabase SQL Editor after 0001 and 0002

create table if not exists comm_template_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table comm_templates add column if not exists sort_order int not null default 0;
alter table comm_templates add column if not exists media_type text;
alter table comm_templates add column if not exists media_filename text;

alter table comm_template_categories enable row level security;
drop policy if exists "authenticated full access" on comm_template_categories;
create policy "authenticated full access" on comm_template_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public) values ('comm-media', 'comm-media', true)
on conflict (id) do nothing;

drop policy if exists "authenticated comm-media upload" on storage.objects;
drop policy if exists "public comm-media read" on storage.objects;
drop policy if exists "authenticated comm-media delete" on storage.objects;
create policy "authenticated comm-media upload" on storage.objects for insert to authenticated with check (bucket_id = 'comm-media');
create policy "public comm-media read" on storage.objects for select using (bucket_id = 'comm-media');
create policy "authenticated comm-media delete" on storage.objects for delete to authenticated using (bucket_id = 'comm-media');

-- Starter categories
insert into comm_template_categories (name, sort_order)
values
  ('Bank Outreach', 0),
  ('Trustee Coordination', 1),
  ('Payment Follow-Up', 2),
  ('Auction & Delivery', 3)
on conflict do nothing;

-- Clear the two placeholder templates from 0002 so they don't duplicate against the fuller starter pack
delete from comm_templates where name in ('Asset Secured — Initial Contact', 'Asset Secured Notification');

-- Starter template pack
insert into comm_templates (category, channel, name, subject, body, sort_order)
values
  ('Bank Outreach', 'sms', 'Asset Secured — Initial Contact', null, 'Hi {{contact_name}}, this is {{sender_name}} with {{company_name}}. We''ve secured one of your assets and sent a full report to your email. Please reach out to arrange payment or delivery.', 0),
  ('Bank Outreach', 'email', 'Asset Secured Notification', 'Notice of Secured Asset — {{company_name}}', 'Hi {{contact_name}},

{{company_name}} has taken possession of an asset tied to your institution. A full secured-asset report with photos and chain of custody is attached.

Please contact us to arrange payment or delivery to the nearest auction.

{{sender_name}}
{{company_name}}', 1),
  ('Bank Outreach', 'call_script', 'First Call — Introduce Ferguson Storage', null, 'Hi, this is {{sender_name}} calling from {{company_name}}. We''ve secured a vehicle tied to one of your files through our trustee network. I''m calling to confirm the right contact for recovery/collections so I can send over the file details and next steps.', 2),
  ('Trustee Coordination', 'sms', 'Pickup Confirmation', null, 'Hi {{contact_name}}, confirming pickup is scheduled for the unit on your file. We''ll send photos and confirmation once it''s secured in storage.', 0),
  ('Trustee Coordination', 'email', 'Authorization Received — Confirming Pickup', 'Confirming Pickup — {{company_name}}', 'Hi {{contact_name}},

Thanks for the authorization. We''ll coordinate pickup and send confirmation with photos once the asset is secured in our storage facility.

{{sender_name}}
{{company_name}}', 1),
  ('Payment Follow-Up', 'sms', 'Invoice Follow-Up — 7 Days', null, 'Hi {{contact_name}}, following up on the storage invoice sent last week for the secured asset on file. Let us know if you need anything to process payment.', 0),
  ('Payment Follow-Up', 'email', 'Payment Reminder', 'Payment Reminder — {{company_name}}', 'Hi {{contact_name}},

This is a follow-up on the outstanding storage invoice. Daily storage charges continue to accrue until payment or pickup arrangements are made.

Let us know how you''d like to proceed.

{{sender_name}}
{{company_name}}', 1),
  ('Auction & Delivery', 'sms', 'Offer Delivery to Auction', null, 'Hi {{contact_name}}, happy to arrange delivery of the secured unit directly to your preferred auction house. Just confirm the location and we''ll quote the delivery fee.', 0),
  ('Auction & Delivery', 'email', 'Delivery to Auction — Quote', 'Delivery Quote — {{company_name}}', 'Hi {{contact_name}},

We can deliver the secured unit directly to your preferred auction house. Let us know the location and we''ll confirm the delivery fee and timeline.

{{sender_name}}
{{company_name}}', 1)
on conflict do nothing;
