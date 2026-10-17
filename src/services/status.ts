import { StatusJsonResponse } from "../types/api";
import { GeoIp2Metadata } from "../types/database";
import { tzdataVersion } from "../utils/timezone-data";

export async function getStatus(db: D1Database): Promise<StatusJsonResponse> {
  const row = await db
    .prepare("select geo_updated_at from geoip2_metadata where id = 1")
    .first<Pick<GeoIp2Metadata, "geo_updated_at">>();

  return {
    geo_updated_at: row?.geo_updated_at ?? null,
    tzdata_version: tzdataVersion,
  };
}
