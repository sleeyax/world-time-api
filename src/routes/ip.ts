import { Hono } from "hono";
import {
  DateTimeJsonResponse,
  DateTimeTextResponse,
  HonoApp,
} from "../types/api";
import { getTime } from "../services/timezone";
import { formatAsText } from "../utils/formatter";
import { getConnInfo } from "hono/cloudflare-workers";
import { HTTPException } from "hono/http-exception";
import { ipToTimezone } from "../services/ip";

export const ipRouter = new Hono<HonoApp>();

// GET /ip - Get time based on client IP (JSON)
ipRouter.get("/ip", async (c) => {
  const clientIp = getConnInfo(c).remote.address;
  if (!clientIp) {
    throw new HTTPException(400, {
      message: "Client IP not detected",
    });
  }

  const timezone = await ipToTimezone(c.env.DB, clientIp);
  if (!timezone) {
    throw new HTTPException(404, {
      message: "Couldn't find geo data for IP",
    });
  }

  const response: DateTimeJsonResponse = getTime(timezone);
  return c.json(response);
});

// GET /ip.txt - Get time based on client IP (plain text)
ipRouter.get("/ip.txt", async (c) => {
  const clientIp = getConnInfo(c).remote.address;
  if (!clientIp) {
    throw new HTTPException(400, {
      message: "Client IP not detected",
    });
  }

  const timezone = await ipToTimezone(c.env.DB, clientIp);
  if (!timezone) {
    throw new HTTPException(404, {
      message: "Couldn't find geo data for IP",
    });
  }

  const response: DateTimeTextResponse = formatAsText(getTime(timezone));
  return c.text(response);
});

// GET /ip/:ipv4 - Get time based on specific IP (JSON)
ipRouter.get("/ip/:ipv4", async (c) => {
  const ipv4 = c.req.param("ipv4");
  if (!ipv4) {
    throw new HTTPException(400, {
      message: "IP parameter is required",
    });
  }

  const timezone = await ipToTimezone(c.env.DB, ipv4);
  if (!timezone) {
    throw new HTTPException(404, {
      message: "Couldn't find geo data for IP",
    });
  }

  const response: DateTimeJsonResponse = getTime(timezone);
  return c.json(response);
});

// GET /ip/:ipv4.txt - Get time based on specific IP (plain text)
ipRouter.get("/ip/:ipv4.txt", async (c) => {
  const ipv4 = c.req.param("ipv4");
  if (!ipv4) {
    throw new HTTPException(400, {
      message: "IP parameter is required",
    });
  }

  const timezone = await ipToTimezone(c.env.DB, ipv4);
  if (!timezone) {
    throw new HTTPException(404, {
      message: "Couldn't find geo data for IP",
    });
  }

  const response: DateTimeTextResponse = formatAsText(getTime(timezone));
  return c.text(response);
});
