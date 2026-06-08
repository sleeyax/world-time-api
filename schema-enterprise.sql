-- Schema for the dedicated `enterprise` D1 database (enterprise keys + usage).

create table if not exists enterprise_keys (
  key_hash text primary key,   -- sha-256 hex of the raw key
  name text not null,          -- label, for log tracing only
  request_limit int,           -- max requests per calendar month; null = unlimited
  created_at text not null default (datetime('now'))
);

-- One row per (key, month). Hot-write counter, kept separate from the config above.
create table if not exists enterprise_key_usage (
  key_hash text not null,
  period text not null,        -- 'YYYY-MM' (UTC)
  count int not null default 0,
  primary key (key_hash, period)
);
