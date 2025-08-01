export type GeoIp2Network = {
  network_start: Buffer;
  network_end: Buffer;
  geoname_id?: number;
  registered_country_geoname_id?: number;
  represented_country_geoname_id?: number;
  is_anonymous_proxy?: boolean;
  is_satellite_provider?: boolean;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  accuracy_radius?: number;
  is_anycast?: boolean;
};

export type GeoIp2Location = {
  geoname_id: number;
  locale_code: string;
  continent_code?: string;
  continent_name?: string;
  country_iso_code?: string;
  country_name?: string;
  subdivision_1_iso_code?: string;
  subdivision_1_name?: string;
  subdivision_2_iso_code?: string;
  subdivision_2_name?: string;
  city_name?: string;
  metro_code?: number;
  time_zone?: string;
  is_in_european_union?: boolean;
};

export type GeoIp2Metadata = {
  id: number;
  last_updated: string;
};
