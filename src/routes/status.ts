import { Hono } from "hono";
import { HonoApp } from "../types/api";
import { getStatus } from "../services/status";

export const statusRouter = new Hono<HonoApp>();

// GET /status - Get when the underlying data was last updated
statusRouter.on("GET", ["/status", "/status.txt"], async (c) => {
  return c.json(await getStatus(c.env.DB));
});
