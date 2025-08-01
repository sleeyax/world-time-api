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

export const timezoneRouter = new Hono<HonoApp>();

// GET /timezone - List all timezones (JSON)
timezoneRouter.get("/timezone", async (c) => {
  try {
    const timezones: ListJsonResponse = getTimeZones();
    return c.json(timezones);
  } catch (error) {
    console.error(error);
    return c.json(
      {
        error: "Internal server error",
      },
      500
    );
  }
});

// GET /timezone.txt - List all timezones (plain text)
timezoneRouter.get("/timezone.txt", async (c) => {
  try {
    const timezones: ListTextResponse = formatAsText(getTimeZones());
    return c.text(timezones);
  } catch (error) {
    return c.text(
      "Internal server error",

      500
    );
  }
});

// GET /timezone/:area - List timezones for area (JSON)
timezoneRouter.get("/timezone/:area", async (c) => {
  try {
    const area = c.req.param("area");
    if (!area) {
      return c.json({ error: "Area parameter is required" }, 400);
    }
    const timezones: ListJsonResponse = getTimeZonesByArea(area);
    return c.json(timezones);
  } catch (error) {
    return c.json(
      {
        error: "Internal server error",
      },
      500
    );
  }
});

// GET /timezone/:area.txt - List timezones for area (plain text)
timezoneRouter.get("/timezone/:area.txt", async (c) => {
  try {
    const area = c.req.param("area");
    if (!area) {
      return c.text("Area parameter is required", 400);
    }
    const timezones: ListTextResponse = formatAsText(getTimeZonesByArea(area));
    return c.text(timezones);
  } catch (error) {
    return c.text("Internal server error", 500);
  }
});

// GET /timezone/:area/:location - Get time for specific location (JSON)
timezoneRouter.get("/timezone/:area/:location", async (c) => {
  try {
    const area = c.req.param("area");
    const location = c.req.param("location");

    if (!area || !location) {
      return c.json({ error: "Area and location parameters are required" }, 400);
    }

    const response: DateTimeJsonResponse = getTime([area, location]);
    return c.json(response);
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /timezone/:area/:location.txt - Get time for specific location (plain text)
timezoneRouter.get("/timezone/:area/:location.txt", async (c) => {
  try {
    const area = c.req.param("area");
    const location = c.req.param("location");

    if (!area || !location) {
      return c.text("Area and location parameters are required", 400);
    }

    const response: DateTimeTextResponse = formatAsText(
      getTime([area, location])
    );
    return c.text(response);
  } catch (error) {
    return c.text("Internal server error", 500);
  }
});

// GET /timezone/:area/:location/:region - Get time for specific region (JSON)
timezoneRouter.get("/timezone/:area/:location/:region", async (c) => {
  try {
    const area = c.req.param("area");
    const location = c.req.param("location");
    const region = c.req.param("region");

    if (!area || !location || !region) {
      return c.json({ error: "Area, location, and region parameters are required" }, 400);
    }

    const response: DateTimeJsonResponse = getTime([area, location, region]);
    return c.json(response);
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /timezone/:area/:location/:region.txt - Get time for specific region (plain text)
timezoneRouter.get("/timezone/:area/:location/:region.txt", async (c) => {
  try {
    const area = c.req.param("area");
    const location = c.req.param("location");
    const region = c.req.param("region");

    if (!area || !location || !region) {
      return c.text("Area, location, and region parameters are required", 400);
    }

    const response: DateTimeTextResponse = formatAsText(
      getTime([area, location, region])
    );
    return c.text(response);
  } catch (error) {
    return c.text("Internal server error", 500);
  }
});

export default timezoneRouter;
