import { Hono } from "hono";
import { DateTimeJsonResponse, DateTimeTextResponse, HonoApp } from "../types/api";
import { getTime } from "../services/timezone";
import { formatAsText } from "../utils/formatter";
import { getConnInfo } from "hono/cloudflare-workers";
import { ipToBinary } from "../utils/ip";
import { GeoIp2Location, GeoIp2Network } from "../types/database";

export const ipRouter = new Hono<HonoApp>();

// GET /ip - Get time based on client IP (JSON)
ipRouter.get("/ip", async (c) => {
  try {
    const clientIp = getConnInfo(c).remote.address;
    if (!clientIp) {
      return c.json({ error: "Client IP not detected" }, 400);
    }

    const timezone = await ipToTimezone(c.env.DB, clientIp);

    if (!timezone) {
      return c.json({ error: `Couldn't find geo data for IP` }, 404);
    }

    if (!timezone) {
      return c.json({ error: `Couldn't find timezone for IP` }, 404);
    }

    const response: DateTimeJsonResponse = getTime(timezone);
    return c.json(response);
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /ip.txt - Get time based on client IP (plain text)
ipRouter.get("/ip.txt", async (c) => {
  try {
    const clientIp = getConnInfo(c).remote.address;
    if (!clientIp) {
      return c.json({ error: "Client IP not detected" }, 400);
    }

    const timezone = await ipToTimezone(c.env.DB, clientIp);

    if (!timezone) {
      return c.text(`Couldn't find geo data for IP`, 404);
    }

    if (!timezone) {
      return c.text(`Couldn't find timezone for IP`, 404);
    }

    const response: DateTimeTextResponse = formatAsText(getTime(timezone));
    return c.text(response);
  } catch (error) {
    return c.text("Internal server error", 500);
  }
});

// GET /ip/:ipv4 - Get time based on specific IP (JSON)
ipRouter.get("/ip/:ipv4", async (c) => {
  try {
    const ipv4 = c.req.param("ipv4");

    if (!ipv4) {
      return c.json({ error: "IP parameter is required" }, 400);
    }

    const timezone = await ipToTimezone(c.env.DB, ipv4);

    if (!timezone) {
      return c.json({ error: `Couldn't find geo data for IP` }, 404);
    }

    if (!timezone) {
      return c.json({ error: `Couldn't find timezone for IP` }, 404);
    }

    const response: DateTimeJsonResponse = getTime(timezone);
    return c.json(response);
  } catch (error) {
    console.error("Error looking up IP:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /ip/:ipv4.txt - Get time based on specific IP (plain text)
ipRouter.get("/ip/:ipv4.txt", async (c) => {
  try {
    const ipv4 = c.req.param("ipv4");

    if (!ipv4) {
      return c.text("IP parameter is required", 400);
    }

    const timezone = await ipToTimezone(c.env.DB, ipv4);

    if (!timezone) {
      return c.text(`Couldn't find geo data for IP`, 404);
    }

    if (!timezone) {
      return c.text(`Couldn't find timezone for IP`, 404);
    }

    const response: DateTimeTextResponse = formatAsText(getTime(timezone));
    return c.text(response);
  } catch (error) {
    return c.text("Internal server error", 500);
  }
});

async function ipToTimezone(db: D1Database, ip: string) {
  const ipBuffer = ipToBinary(ip);

  const row = await db.prepare(`
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
`).bind(ipBuffer).first<{
  time_zone: string | null;
  registered_country_timezone: string | null;
  represented_country_timezone: string | null;
} | null>();
  
  if (!row) {
    return null;
  }

  const timezone = row.time_zone || row.registered_country_timezone || row.represented_country_timezone;

  return timezone;
}
