export type MaxMindIpBlock = {
  network: string;
  geoname_id?: number;
  registered_country_geoname_id?: number;
  represented_country_geoname_id?: number;
  is_anonymous_proxy?: string;
  is_satellite_provider?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  accuracy_radius?: string;
  is_anycast?: string;
};

export type MaxMindLocation = {
  geoname_id: string;
  locale_code: string;
  continent_code: string;
  continent_name: string;
  country_iso_code: string;
  country_name: string;
  subdivision_1_iso_code?: string;
  subdivision_1_name?: string;
  subdivision_2_iso_code?: string;
  subdivision_2_name?: string;
  city_name?: string;
  metro_code?: string;
  time_zone?: string;
  is_in_european_union?: string;
};
