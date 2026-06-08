-- Schema for the dedicated `enterprise` D1 database (enterprise keys + usage).

create table if not exists enterprise_keys (
  key_hash text primary key,   -- sha-256 hex of the raw key
  name text not null,          -- label, for log tracing only
  request_limit int,           -- max requests per calendar month; null = unlimited
  whop_membership_id text,     -- source Whop membership (mem_...); null for manually-created keys
  created_at text not null default (datetime('now'))
);

-- At most one key per Whop membership.
-- Partial index so multiple manual keys (whop_membership_id is null) don't collide.
create unique index if not exists idx_enterprise_keys_whop_membership
  on enterprise_keys (whop_membership_id)
  where whop_membership_id is not null;

-- One row per (key, month). Hot-write counter, kept separate from the config above.
create table if not exists enterprise_key_usage (
  key_hash text not null,
  period text not null,        -- 'YYYY-MM' (UTC)
  count int not null default 0,
  primary key (key_hash, period)
);

-- Whop product (access_pass, prod_...) -> monthly request limit.
-- A row's existence is the allowlist: only products listed here grant API access on subscribe.
create table if not exists whop_plans (
  product_id text primary key, -- Whop product id (prod_...)
  request_limit int            -- max requests per calendar month; null = unlimited
);
