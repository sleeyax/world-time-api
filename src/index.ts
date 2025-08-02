import { Hono } from "hono";
import { timezoneRouter } from "./routes/timezone";
import { ipRouter } from "./routes/ip";
import { HonoApp } from "./types/api";
import { clientIpMiddleware } from "./middleware/client-ip";
import { HTTPException } from "hono/http-exception";

const app = new Hono<HonoApp>({ strict: false });

app.onError((rawError, c) => {
  const error =
    rawError instanceof HTTPException
      ? rawError
      : new HTTPException(500, {
          message: "Internal Server Error",
          cause: rawError,
        });

  console.error(error);

  return c.json(
    {
      error: error.message,
    },
    error.status,
  );
});

// Apply IP middleware to world time API routes only.
app.use("/api/timezone/*", clientIpMiddleware);
app.use("/api/ip/*", clientIpMiddleware);

app.get("/", (c) => {
  return c.text(
    "A world time API that actually works. Built with <3 by Sleeyax",
  );
});
app.route("/api", timezoneRouter);
app.route("/api", ipRouter);

export default app;
