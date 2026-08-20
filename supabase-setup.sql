-- Run this in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  party text not null,
  order_no text,
  order_date date,
  item text not null,
  quantity text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'done')),
  done_date timestamptz,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table orders enable row level security;

-- Allow anyone with the anon key (i.e. your app) to read and write.
-- This is fine for an internal office tool where the link itself is
-- the access control. If you want a login screen later, we can add
-- Supabase Auth and tighten these policies.
create policy "Allow all reads" on orders
  for select using (true);

create policy "Allow all inserts" on orders
  for insert with check (true);

create policy "Allow all updates" on orders
  for update using (true);

create policy "Allow all deletes" on orders
  for delete using (true);

-- Enable realtime so all devices sync live
alter publication supabase_realtime add table orders;
