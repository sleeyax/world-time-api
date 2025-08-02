import { Address4, Address6 } from "ip-address";
import { MaxMindIpBlock, MaxMindLocation } from "./types";
import { GeoIp2Location, GeoIp2Network } from "../../src/types/database";
import { chunkArray } from "./utils";

export const mapToGeoIp2Network = (row: MaxMindIpBlock): GeoIp2Network => ({
  network_start: ipToBinaryRanges(row.network).start,
  network_end: ipToBinaryRanges(row.network).end,
  geoname_id: row.geoname_id,
  registered_country_geoname_id: row.registered_country_geoname_id,
  represented_country_geoname_id: row.represented_country_geoname_id,
  accuracy_radius: row.accuracy_radius
    ? parseInt(row.accuracy_radius, 10)
    : undefined,
  is_anonymous_proxy: row.is_anonymous_proxy
    ? row.is_anonymous_proxy === "1"
    : undefined,
  is_satellite_provider: row.is_satellite_provider
    ? row.is_satellite_provider === "1"
    : undefined,
  postal_code: row.postal_code,
  latitude: row.latitude,
  longitude: row.longitude,
  is_anycast: row.is_anycast ? row.is_anycast === "1" : undefined,
});

export const mapToGeoIp2Location = (row: MaxMindLocation): GeoIp2Location => ({
  geoname_id: parseInt(row.geoname_id),
  locale_code: row.locale_code,
  continent_code: row.continent_code,
  continent_name: row.continent_name,
  country_iso_code: row.country_iso_code,
  country_name: row.country_name,
  subdivision_1_iso_code: row.subdivision_1_iso_code,
  subdivision_1_name: row.subdivision_1_name,
  subdivision_2_iso_code: row.subdivision_2_iso_code,
  subdivision_2_name: row.subdivision_2_name,
  city_name: row.city_name,
  metro_code: row.metro_code ? parseInt(row.metro_code, 10) : undefined,
  time_zone: row.time_zone,
  is_in_european_union: row.is_in_european_union
    ? row.is_in_european_union === "1"
    : undefined,
});

type MakeSqlInsertOptions = {
  data: Record<string, unknown>[];
  tableName: string;
  onConflict: string[];
  addTransaction?: boolean;
  maxValuesEach?: number;
};

export function makeSqlInsert({
  data,
  tableName,
  onConflict,
  addTransaction = false,
  maxValuesEach = 250, // as recommended in https://developers.cloudflare.com/d1/best-practices/import-export-data/#resolve-statement-too-long-error
}: MakeSqlInsertOptions) {
  const columnsArr = Object.keys(data[0]);
  const columns = columnsArr.join(",");

  // Prepare update assignments for all columns except conflictCol
  const updateAssignments = columnsArr
    .filter((col) => !onConflict.includes(col))
    .map((col) => `${col}=excluded.${col}`)
    .join(", ");

  // WHERE clause to prevent unnecessary writes
  const whereClause = columnsArr
    .filter((col) => !onConflict.includes(col))
    .map((col) => `${col} IS NOT excluded.${col}`)
    .join(" OR ");

  const dataChunks = chunkArray(data, maxValuesEach);
  const sqlStatements = dataChunks.map((chunk) => {
    const values = chunk
      .map((row: any) => {
        return (
          "\n(" +
          columnsArr
            .map((col) => {
              const val = row[col];
              if (val === null || val === undefined || val === "") {
                return "NULL";
              }
              // Handle Buffer values for BLOB columns
              if (Buffer.isBuffer(val)) {
                return `X'${val.toString("hex")}'`;
              }
              return `'${String(val).replace(/'/g, "").replace(/"/g, "'")}'`;
            })
            .join(",") +
          ")"
        );
      })
      .join(",");

    return `INSERT INTO ${tableName} (${columns})\nVALUES ${values}\nON CONFLICT(${onConflict.join(
      ", ",
    )}) DO UPDATE SET ${updateAssignments}\nWHERE ${whereClause};`;
  });

  const sql = sqlStatements.join("\n\n");

  if (addTransaction) {
    return `BEGIN;\n${sql}\nCOMMIT;\n`;
  }

  return sql;
}

export function ipToBinaryRanges(ip: string) {
  let address: Address4 | Address6;

  if (ip.includes(":")) {
    address = new Address6(ip);
  } else {
    address = new Address4(ip);
  }

  const startAddress = address.startAddress();
  const endAddress = address.endAddress();

  const startBigInt = startAddress.bigInt();
  const endBigInt = endAddress.bigInt();

  return {
    start: bigIntToBuffer(startBigInt, 16),
    end: bigIntToBuffer(endBigInt, 16),
  };
}

function bigIntToBuffer(bigint: bigint, byteLength: number): Buffer {
  const hex = bigint.toString(16).padStart(byteLength * 2, "0");
  return Buffer.from(hex, "hex");
}
