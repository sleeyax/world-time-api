import { Hono } from "hono";
import { ListJsonResponse, DateTimeJsonResponse, HonoApp } from "../types/api";
import {
  getTime,
  getTimeZones,
  getTimeZonesByArea,
} from "../services/timezone";
import { HTTPException } from "hono/http-exception";
import { isTimeZoneNotFoundError } from "../utils/error";

export const timezoneRouter = new Hono<HonoApp>();

// GET /timezone - List all timezones (JSON, plain text)
timezoneRouter.on("GET", ["/timezone", "/timezone.txt"], (c) => {
  const timezones: ListJsonResponse = getTimeZones();
  return c.json(timezones);
});

// GET /timezone/:area - List timezones for area (JSON, plain text)
timezoneRouter.on("GET", ["/timezone/:area", "/timezone/:area.txt"], (c) => {
  const area = c.req.param("area").replace(/\.txt$/, "");
  if (!area) {
    throw new HTTPException(400, {
      message: "Area parameter is required",
    });
  }

  const timezones: ListJsonResponse = getTimeZonesByArea(area);
  if (timezones.length === 0) {
    throw new HTTPException(400, {
      message: `unknown location ${area}`,
    });
  }

  return c.json(timezones);
});

// GET /timezone/:area/:location - Get time for specific location (JSON, plain text)
timezoneRouter.on(
  "GET",
  [
    "/timezone/:area/:location/:region?",
    "/timezone/:area/:location/:region?.txt",
  ],
  (c) => {
    const area = c.req.param("area");
    const location = c.req.param("location").replace(/\.txt$/, "");
    const region = c.req.param("region")?.replace(/\.txt$/, "");
    const zone = `${area}/${location}${region ? `/${region}` : ""}`;
    if (!area || !location) {
      throw new HTTPException(400, {
        message: "Area and location parameters are required",
      });
    }

    try {
      const response: DateTimeJsonResponse = getTime(zone);
      return c.json(response);
    } catch (error) {
      if (isTimeZoneNotFoundError(error)) {
        throw new HTTPException(400, {
          message: `unknown location ${zone}`,
        });
      }

      throw error;
    }
  },
);
