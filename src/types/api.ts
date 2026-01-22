// Response types based on OpenAPI specification

export interface DateTimeJsonResponse {
  abbreviation: string;
  datetime: string;
  day_of_week: number;
  day_of_year: number;
  dst: boolean;
  dst_offset: number;
  timezone: string;
  unixtime: number;
  utc_datetime: string;
  utc_offset: string;
  week_number: number;
  dst_from: string | null;
  dst_until: string | null;
  raw_offset: number | null;
}

export type DateTimeTextResponse = string;

export type ListJsonResponse = string[];

export type ListTextResponse = string;

export interface ErrorJsonResponse {
  error: string;
}

export type ErrorTextResponse = string;

export interface GeoSubdivision {
  code: string;
  name: string;
}

export interface GeoJsonResponse {
  ip: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_radius: number | null;
  city: string | null;
  postal_code: string | null;
  metro_code: number | null;
  subdivisions: GeoSubdivision[];
  country: {
    code: string | null;
    name: string | null;
  };
  continent: {
    code: string | null;
    name: string | null;
  };
  is_in_european_union: boolean;
}

// Request parameter types
export interface TimezoneParams {
  area: string;
}

export interface LocationParams {
  area: string;
  location: string;
}

export interface RegionParams {
  area: string;
  location: string;
  region: string;
}

export interface IpParams {
  ip: string;
}

// Utility types for route handlers
export type TimezoneListHandler = () => Promise<
  ListJsonResponse | ListTextResponse
>;
export type TimezoneAreaHandler = (
  params: TimezoneParams,
) => Promise<ListJsonResponse | ListTextResponse>;
export type DateTimeHandler = (
  params: LocationParams | RegionParams,
  clientIp?: string,
) => Promise<DateTimeJsonResponse | DateTimeTextResponse>;
export type IpHandler = (
  params?: IpParams,
  clientIp?: string,
) => Promise<DateTimeJsonResponse | DateTimeTextResponse>;

export type HonoApp = { Bindings: Bindings };

export type Bindings = {
  DB: D1Database;
};
