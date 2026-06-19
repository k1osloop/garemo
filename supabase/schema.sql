-- Garemo Sprint 0 baseline schema.
-- Run this manually in a new Supabase project SQL editor.
-- This file enables Row Level Security but intentionally does not create open policies.

begin;

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('buyer', 'owner', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('active', 'disabled');
  end if;

  if not exists (select 1 from pg_type where typname = 'business_status') then
    create type public.business_status as enum (
      'draft',
      'pending_review',
      'active',
      'hidden',
      'rejected'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type public.report_reason as enum (
      'wrong_info',
      'closed',
      'duplicate',
      'abuse',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum (
      'open',
      'reviewing',
      'resolved',
      'dismissed'
    );
  end if;
end $$;

-- Stores application profile data linked to Supabase Auth users.
create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'buyer',
  phone text,
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_profile_email_format check (position('@' in email) > 1),
  constraint users_profile_phone_length check (phone is null or char_length(phone) between 7 and 30)
);

comment on table public.users_profile is
  'Application profiles linked to Supabase Auth users.';
comment on column public.users_profile.role is
  'Application role: buyer, owner, or admin.';

-- Defines public business categories used for directory filters.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(name) between 2 and 80),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

comment on table public.categories is
  'Directory categories such as food, printing, academic services, and others.';

-- Stores owner-managed businesses submitted to the Garemo directory.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users_profile(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null,
  status public.business_status not null default 'pending_review',
  price_range text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_name_length check (char_length(name) between 2 and 120),
  constraint businesses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint businesses_description_length check (char_length(description) between 10 and 500),
  constraint businesses_price_range_length check (
    price_range is null or char_length(price_range) <= 80
  )
);

comment on table public.businesses is
  'Businesses and university ventures listed in Garemo.';
comment on column public.businesses.status is
  'Moderation and publication state for directory visibility.';

-- Stores one primary human-readable and optional coordinate location per business.
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  address_text text not null,
  campus_zone text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_address_length check (char_length(address_text) between 3 and 240),
  constraint locations_campus_zone_length check (
    campus_zone is null or char_length(campus_zone) <= 120
  ),
  constraint locations_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint locations_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint locations_coordinates_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  )
);

comment on table public.locations is
  'Primary campus or nearby location for a business, with optional map coordinates.';

-- Stores weekly opening hours per business.
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week integer not null,
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_day_of_week_range check (day_of_week between 0 and 6),
  constraint schedules_time_validity check (
    is_closed = true
    or (opens_at is not null and closes_at is not null and opens_at < closes_at)
  ),
  unique (business_id, day_of_week)
);

comment on table public.schedules is
  'Weekly business hours. day_of_week uses 0-6 and is unique per business.';

-- Stores image metadata for business profile images kept in Supabase Storage.
create table if not exists public.business_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  public_url text,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint business_images_storage_path_length check (char_length(storage_path) between 3 and 500),
  constraint business_images_alt_text_length check (
    alt_text is null or char_length(alt_text) <= 160
  )
);

comment on table public.business_images is
  'Image metadata for business profile assets stored in Supabase Storage.';

-- Stores public contact channels for a business.
create table if not exists public.contact_info (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  whatsapp_number text not null,
  instagram_url text,
  facebook_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_info_whatsapp_length check (char_length(whatsapp_number) between 7 and 30),
  constraint contact_info_instagram_length check (
    instagram_url is null or char_length(instagram_url) <= 250
  ),
  constraint contact_info_facebook_length check (
    facebook_url is null or char_length(facebook_url) <= 250
  ),
  constraint contact_info_website_length check (
    website_url is null or char_length(website_url) <= 250
  )
);

comment on table public.contact_info is
  'WhatsApp and optional social links used to contact a business.';

-- Stores saved businesses for authenticated buyers. Not part of Sprint 1 UI.
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, business_id)
);

comment on table public.favorites is
  'User saved businesses for later versions. No UI is implemented in Sprint 0.';

-- Stores user or visitor reports about incorrect or abusive business data.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users_profile(id) on delete set null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_details_length check (details is null or char_length(details) <= 1000)
);

comment on table public.reports is
  'Moderation reports for wrong information, duplicates, closed businesses, abuse, or other issues.';

create index if not exists users_profile_role_idx
  on public.users_profile(role);
create index if not exists users_profile_status_idx
  on public.users_profile(status);

create index if not exists categories_active_sort_idx
  on public.categories(is_active, sort_order);
create index if not exists categories_slug_idx
  on public.categories(slug);

create index if not exists businesses_category_status_idx
  on public.businesses(category_id, status);
create index if not exists businesses_owner_idx
  on public.businesses(owner_id);
create index if not exists businesses_slug_idx
  on public.businesses(slug);
create index if not exists businesses_name_idx
  on public.businesses(name);

create index if not exists locations_business_idx
  on public.locations(business_id);
create index if not exists locations_campus_zone_idx
  on public.locations(campus_zone);
create index if not exists locations_coordinates_idx
  on public.locations(latitude, longitude);

create index if not exists schedules_business_day_idx
  on public.schedules(business_id, day_of_week);

create index if not exists business_images_business_sort_idx
  on public.business_images(business_id, sort_order);

create index if not exists contact_info_business_idx
  on public.contact_info(business_id);

create index if not exists favorites_user_idx
  on public.favorites(user_id);
create index if not exists favorites_business_idx
  on public.favorites(business_id);

create index if not exists reports_business_status_idx
  on public.reports(business_id, status);
create index if not exists reports_reason_idx
  on public.reports(reason);

alter table public.users_profile enable row level security;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.locations enable row level security;
alter table public.schedules enable row level security;
alter table public.business_images enable row level security;
alter table public.contact_info enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;

-- Policies are intentionally not created in Sprint 0.
-- Add explicit read/write policies only after Supabase project setup and role testing.

commit;
