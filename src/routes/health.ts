import { Hono } from "hono";
import { HonoApp } from "../types/api";

export const healthRouter = new Hono<HonoApp>();

healthRouter.get("/ping", (c) => {
  return c.text("ok");
});
