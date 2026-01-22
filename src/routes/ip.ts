import { Hono } from "hono";
import { DateTimeJsonResponse, HonoApp } from "../types/api";
import { getTime } from "../services/timezone";
import { HTTPException } from "hono/http-exception";
import { getClientIp, ipToTimezone } from "../services/ip";
import { AddressError } from "ip-address";
import { isTimeZoneNotFoundError } from "../utils/error";

export const ipRouter = new Hono<HonoApp>();

// GET /ip - Get time based on client IP (JSON, plain text)
ipRouter.on("GET", ["/ip", "ip.txt"], async (c) => {
  const clientIp = getClientIp(c);
  if (!clientIp) {
    throw new HTTPException(400, {
      message: "Client IP not detected",
    });
  }

  const timezone = await ipToTimezone(c.env.DB, clientIp);
  if (!timezone) {
    throw new HTTPException(404, {
      message: `Couldn't find geo data for IP ${clientIp}`,
    });
  }

  const response: DateTimeJsonResponse = getTime(timezone);
  return c.json(response);
});

// GET /ip/:ip - Get time based on specific IP (JSON, plain text)
ipRouter.on("GET", ["/ip/:ip", "/ip/:ip.txt"], async (c) => {
  const ip = c.req.param("ip").replace(/\.txt$/, "");
  if (!ip) {
    throw new HTTPException(400, {
      message: "IP parameter is required",
    });
  }

  let timezone: string | null;

  try {
    timezone = await ipToTimezone(c.env.DB, ip);
    if (!timezone) {
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

  try {
    const response: DateTimeJsonResponse = getTime(timezone);
    return c.json(response);
  } catch (error) {
    if (isTimeZoneNotFoundError(error)) {
      throw new HTTPException(400, {
        message: `unknown location ${timezone}`,
      });
    }

    throw error;
  }
});
