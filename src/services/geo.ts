import { ipToBinary } from "../utils/ip";
import { GeoJsonResponse, GeoSubdivision } from "../types/api";

interface GeoRow {
  latitude: number | null;
  longitude: number | null;
  accuracy_radius: number | null;
  postal_code: string | null;
  city_name: string | null;
  metro_code: number | null;
  subdivision_1_iso_code: string | null;
  subdivision_1_name: string | null;
  subdivision_2_iso_code: string | null;
  subdivision_2_name: string | null;
  country_iso_code: string | null;
  country_name: string | null;
  continent_code: string | null;
  continent_name: string | null;
  is_in_european_union: number | null;
  // Fallback fields from registered_country
  registered_country_iso_code: string | null;
  registered_country_name: string | null;
  registered_continent_code: string | null;
  registered_continent_name: string | null;
  registered_is_in_european_union: number | null;
}

export async function ipToGeoLocation(
  db: D1Database,
  ip: string,
): Promise<GeoJsonResponse | null> {
  const ipBuffer = ipToBinary(ip);

  const row = await db
    .prepare(
      `
select
  net.latitude,
  net.longitude,
  net.accuracy_radius,
  net.postal_code,
  location.city_name,
  location.metro_code,
  location.subdivision_1_iso_code,
  location.subdivision_1_name,
  location.subdivision_2_iso_code,
  location.subdivision_2_name,
  location.country_iso_code,
  location.country_name,
  location.continent_code,
  location.continent_name,
  location.is_in_european_union,
  registered_country.country_iso_code as registered_country_iso_code,
  registered_country.country_name as registered_country_name,
  registered_country.continent_code as registered_continent_code,
  registered_country.continent_name as registered_continent_name,
  registered_country.is_in_european_union as registered_is_in_european_union
from
  geoip2_network net
left join geoip2_location location on (
  net.geoname_id = location.geoname_id and location.locale_code = 'en'
)
left join geoip2_location registered_country on (
  net.registered_country_geoname_id = registered_country.geoname_id
  and registered_country.locale_code = 'en'
)
where ? between net.network_start and net.network_end
order by net.network_end
limit 1;
`,
    )
    .bind(ipBuffer)
    .first<GeoRow | null>();

  if (!row) {
    return null;
  }

  // Build subdivisions array, filtering out nulls
  const subdivisions: GeoSubdivision[] = [];
  if (row.subdivision_1_iso_code && row.subdivision_1_name) {
    subdivisions.push({
      code: row.subdivision_1_iso_code,
      name: row.subdivision_1_name,
    });
  }
  if (row.subdivision_2_iso_code && row.subdivision_2_name) {
    subdivisions.push({
      code: row.subdivision_2_iso_code,
      name: row.subdivision_2_name,
    });
  }

  // Use fallbacks from registered_country if primary lookup fails
  const countryCode = row.country_iso_code || row.registered_country_iso_code;
  const countryName = row.country_name || row.registered_country_name;
  const continentCode = row.continent_code || row.registered_continent_code;
  const continentName = row.continent_name || row.registered_continent_name;
  const isInEu =
    row.is_in_european_union ?? row.registered_is_in_european_union ?? 0;

  return {
    ip,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy_radius: row.accuracy_radius,
    city: row.city_name,
    postal_code: row.postal_code,
    metro_code: row.metro_code,
    subdivisions,
    country: {
      code: countryCode,
      name: countryName,
    },
    continent: {
      code: continentCode,
      name: continentName,
    },
    is_in_european_union: Boolean(isInEu),
  };
}
