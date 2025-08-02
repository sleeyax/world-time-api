import { Hono } from "hono";
import {
  ListJsonResponse,
  ListTextResponse,
  DateTimeJsonResponse,
  DateTimeTextResponse,
  HonoApp,
} from "../types/api";
import {
  getTime,
  getTimeZones,
  getTimeZonesByArea,
} from "../services/timezone";
import { formatAsText } from "../utils/formatter";
import { HTTPException } from "hono/http-exception";

export const timezoneRouter = new Hono<HonoApp>();

// GET /timezone - List all timezones (JSON)
timezoneRouter.get("/timezone", (c) => {
  const timezones: ListJsonResponse = getTimeZones();
  return c.json(timezones);
});

// GET /timezone.txt - List all timezones (plain text)
timezoneRouter.get("/timezone.txt", (c) => {
  const timezones: ListTextResponse = formatAsText(getTimeZones());
  return c.text(timezones);
});

// GET /timezone/:area - List timezones for area (JSON)
timezoneRouter.get("/timezone/:area", (c) => {
  const area = c.req.param("area");
  if (!area) {
    throw new HTTPException(400, {
      message: "Area parameter is required",
    });
  }

  const timezones: ListJsonResponse = getTimeZonesByArea(area);
  return c.json(timezones);
});

// GET /timezone/:area.txt - List timezones for area (plain text)
timezoneRouter.get("/timezone/:area.txt", (c) => {
  const area = c.req.param("area");
  if (!area) {
    throw new HTTPException(400, {
      message: "Area parameter is required",
    });
  }

  const timezones: ListTextResponse = formatAsText(getTimeZonesByArea(area));
  return c.text(timezones);
});

// GET /timezone/:area/:location - Get time for specific location (JSON)
timezoneRouter.get("/timezone/:area/:location", (c) => {
  const area = c.req.param("area");
  const location = c.req.param("location");
  if (!area || !location) {
    throw new HTTPException(400, {
      message: "Area and location parameters are required",
    });
  }

  const response: DateTimeJsonResponse = getTime([area, location]);
  return c.json(response);
});

// GET /timezone/:area/:location.txt - Get time for specific location (plain text)
timezoneRouter.get("/timezone/:area/:location.txt", (c) => {
  const area = c.req.param("area");
  const location = c.req.param("location");
  if (!area || !location) {
    throw new HTTPException(400, {
      message: "Area and location parameters are required",
    });
  }

  const response: DateTimeTextResponse = formatAsText(
    getTime([area, location]),
  );
  return c.text(response);
});

// GET /timezone/:area/:location/:region - Get time for specific region (JSON)
timezoneRouter.get("/timezone/:area/:location/:region", (c) => {
  const area = c.req.param("area");
  const location = c.req.param("location");
  const region = c.req.param("region");
  if (!area || !location || !region) {
    throw new HTTPException(400, {
      message: "Area, location, and region parameters are required",
    });
  }

  const response: DateTimeJsonResponse = getTime([area, location, region]);
  return c.json(response);
});

// GET /timezone/:area/:location/:region.txt - Get time for specific region (plain text)
timezoneRouter.get("/timezone/:area/:location/:region.txt", (c) => {
  const area = c.req.param("area");
  const location = c.req.param("location");
  const region = c.req.param("region");
  if (!area || !location || !region) {
    throw new HTTPException(400, {
      message: "Area, location, and region parameters are required",
    });
  }

  const response: DateTimeTextResponse = formatAsText(
    getTime([area, location, region]),
  );
  return c.text(response);
});
