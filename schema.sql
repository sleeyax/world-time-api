-- Schema based on: https://dev.maxmind.com/geoip/importing-databases/mysql/#create-a-table-for-network-data.

create table if not exists geoip2_network (
  network_start blob not null,
  network_end blob not null,
  geoname_id int,
  registered_country_geoname_id int,
  represented_country_geoname_id int,
  is_anonymous_proxy bool,
  is_satellite_provider bool,
  postal_code text,
  latitude float,
  longitude float,
  accuracy_radius int,
  is_anycast bool,
  unique (network_start, network_end)
);

create index if not exists idx_network_start on geoip2_network(network_start);
create index if not exists idx_network_end on geoip2_network(network_end);

create table if not exists geoip2_location (
  geoname_id int not null,
  locale_code text not null,
  continent_code text,
  continent_name text,
  country_iso_code text,
  country_name text,
  subdivision_1_iso_code text,
  subdivision_1_name text,
  subdivision_2_iso_code text,
  subdivision_2_name text,
  city_name text,
  metro_code int,
  time_zone text,
  is_in_european_union bool,
  primary key (geoname_id, locale_code)
);

create table if not exists geoip2_metadata (
  id integer primary key autoincrement,
  last_updated text not null
);
