import { Context } from "hono";
import { ipToBinary } from "../utils/ip";
import { getConnInfo } from "hono/cloudflare-workers";

export async function ipToTimezone(db: D1Database, ip: string) {
  const ipBuffer = ipToBinary(ip);

  const row = await db
    .prepare(
      `
select 
  location.time_zone as timezone, 
  registered_country.time_zone as registered_country_timezone, 
  represented_country.time_zone as represented_country_timezone
from 
  geoip2_network net
left join geoip2_location location on (
  net.geoname_id = location.geoname_id and location.locale_code = 'en'
)
left join geoip2_location registered_country on (
  net.registered_country_geoname_id = registered_country.geoname_id
  and registered_country.locale_code = 'en'
)
left join geoip2_location represented_country on (
  net.represented_country_geoname_id = represented_country.geoname_id
  and represented_country.locale_code = 'en'
)
where ? between net.network_start and net.network_end
order by net.network_end
limit 1;
`,
    )
    .bind(ipBuffer)
    .first<{
      time_zone: string | null;
      registered_country_timezone: string | null;
      represented_country_timezone: string | null;
    } | null>();

  if (!row) {
    return null;
  }

  const timezone =
    row.time_zone ||
    row.registered_country_timezone ||
    row.represented_country_timezone;

  return timezone;
}

export function getClientIp(c: Context) {
  // See: https://docs.rapidapi.com/docs/additional-request-headers.
  const ipForwardedByRapidAPI = c.req
    .header("x-forwarded-for")
    ?.split(",")[0]
    .trim();
  const ipForwardedByMagicAPI = c.req.header("x-original-forwarded-for");
  return (
    ipForwardedByMagicAPI ||
    ipForwardedByRapidAPI ||
    getConnInfo(c).remote.address ||
    "127.0.0.1"
  );
}
