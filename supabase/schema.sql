-- ============================================================
-- CFP Tracker - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Predefined categories for filtering
create type cfp_category as enum (
  'Identity & Access Management',
  'OAuth / OIDC / SSO',
  'Zero Trust & Authorization',
  'AI / Machine Learning',
  'Security & Privacy',
  'Web Development',
  'DevOps & Infrastructure',
  'Cloud Computing',
  'Mobile Development',
  'Data Engineering',
  'Open Source',
  'Programming Languages',
  'Networking',
  'Other'
);

create table cfps (
  id              uuid            default gen_random_uuid() primary key,
  title           text            not null,
  conference_name text            not null,
  description     text,
  deadline        date            not null,
  location        text,
  is_virtual      boolean         not null default false,
  url             text,
  category        cfp_category    not null,
  tags            text[]          not null default '{}',
  submitted_by    text,           -- Thunder OIDC subject (user ID)
  created_at      timestamptz     not null default now()
);

-- Indexes for common filter queries
create index cfps_category_idx  on cfps (category);
create index cfps_deadline_idx  on cfps (deadline);
create index cfps_virtual_idx   on cfps (is_virtual);

-- Enable Row Level Security
alter table cfps enable row level security;

-- Everyone can read CFPs
create policy "cfps_public_read"
  on cfps for select
  using (true);

-- Anyone can insert (auth enforced server-side in Next.js)
create policy "cfps_authenticated_insert"
  on cfps for insert
  with check (true);
