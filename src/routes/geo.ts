import { Hono } from "hono";
import { GeoJsonResponse, HonoApp } from "../types/api";
import { HTTPException } from "hono/http-exception";
import { getClientIp } from "../services/ip";
import { ipToGeoLocation } from "../services/geo";
import { AddressError } from "ip-address";

export const geoRouter = new Hono<HonoApp>();

// GET /geo - Get geo data for client IP
geoRouter.on("GET", ["/geo", "/geo.txt"], async (c) => {
  const clientIp = getClientIp(c);
  if (!clientIp) {
    throw new HTTPException(400, {
      message: "Client IP not detected",
    });
  }

  const response = await ipToGeoLocation(c.env.DB, clientIp);
  if (!response) {
    throw new HTTPException(404, {
      message: `Couldn't find geo data for IP ${clientIp}`,
    });
  }

  return c.json(response);
});

// GET /geo/:ip - Get geo data for specific IP
geoRouter.on("GET", ["/geo/:ip", "/geo/:ip.txt"], async (c) => {
  const ip = c.req.param("ip").replace(/\.txt$/, "");
  if (!ip) {
    throw new HTTPException(400, {
      message: "IP parameter is required",
    });
  }

  let response: GeoJsonResponse | null;

  try {
    response = await ipToGeoLocation(c.env.DB, ip);
    if (!response) {
      throw new HTTPException(404, {
        message: `Couldn't find geo data for IP ${ip}`,
      });
    }
  } catch (error) {
    if (error instanceof AddressError) {
      throw new HTTPException(400, {
        message: "malformed ip",
      });
    }
    throw error;
  }

  return c.json(response);
});
