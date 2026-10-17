import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, SQLInputValue } from "node:sqlite";
import { beforeAll, describe, expect, it } from "vitest";
import { ipToBinary } from "../utils/ip";
import { ipToGeoLocation } from "./geo";
import { ipToTimezone } from "./ip";

type Network = {
  start: string;
  end: string;
  geonameId: number;
};

const US = 6252001;
const AU = 2077456;

const networks: Network[] = [
  { start: "1.0.0.0", end: "1.0.0.255", geonameId: AU },
  { start: "8.8.8.0", end: "8.8.8.255", geonameId: US },
  {
    start: "2001:4860::",
    end: "2001:4860:ffff:ffff:ffff:ffff:ffff:ffff",
    geonameId: US,
  },
];

function sqliteD1(db: DatabaseSync): D1Database {
  return {
    prepare: (sql: string) => ({
      bind: (...params: SQLInputValue[]) => ({
        first: async () => db.prepare(sql).get(...params) ?? null,
      }),
    }),
  } as unknown as D1Database;
}

let d1: D1Database;

beforeAll(() => {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(join(process.cwd(), "schema.sql"), "utf8"));

  const insertLocation = db.prepare(
    "insert into geoip2_location (geoname_id, locale_code, continent_code, continent_name, country_iso_code, country_name, time_zone, is_in_european_union) values (?, 'en', ?, ?, ?, ?, ?, 0)",
  );
  insertLocation.run(
    US,
    "NA",
    "North America",
    "US",
    "United States",
    "America/Chicago",
  );
  insertLocation.run(
    AU,
    "OC",
    "Oceania",
    "AU",
    "Australia",
    "Australia/Brisbane",
  );

  const insertNetwork = db.prepare(
    "insert into geoip2_network (network_start, network_end, geoname_id, registered_country_geoname_id) values (?, ?, ?, ?)",
  );
  for (const { start, end, geonameId } of networks) {
    insertNetwork.run(ipToBinary(start), ipToBinary(end), geonameId, geonameId);
  }

  d1 = sqliteD1(db);
});

const hits = [
  { ip: "1.0.0.1", country: "AU", timezone: "Australia/Brisbane" },
  { ip: "8.8.8.0", country: "US", timezone: "America/Chicago" },
  { ip: "8.8.8.8", country: "US", timezone: "America/Chicago" },
  { ip: "8.8.8.255", country: "US", timezone: "America/Chicago" },
  { ip: "2001:4860:4860::8888", country: "US", timezone: "America/Chicago" },
];

const misses = [
  { ip: "0.0.0.1", where: "before the first network" },
  { ip: "5.5.5.5", where: "between two IPv4 networks" },
  { ip: "8.8.9.0", where: "right after a network ends" },
  { ip: "192.168.0.1", where: "between the IPv4 and IPv6 networks" },
  { ip: "2001:db8::1", where: "in an IPv6 gap" },
  { ip: "ffff::1", where: "after the last network" },
];

describe("ipToTimezone", () => {
  it.each(hits)("returns $timezone for $ip", async ({ ip, timezone }) => {
    expect(await ipToTimezone(d1, ip)).toBe(timezone);
  });

  it.each(misses)("returns null for $ip ($where)", async ({ ip }) => {
    expect(await ipToTimezone(d1, ip)).toBeNull();
  });
});

describe("ipToGeoLocation", () => {
  it.each(hits)(
    "returns $country for $ip",
    async ({ ip, country, timezone }) => {
      const geo = await ipToGeoLocation(d1, ip);

      expect(geo?.country.code).toBe(country);
      expect(geo?.timezone).toBe(timezone);
    },
  );

  it.each(misses)("returns null for $ip ($where)", async ({ ip }) => {
    expect(await ipToGeoLocation(d1, ip)).toBeNull();
  });
});
