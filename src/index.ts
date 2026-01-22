import { Hono } from "hono";
import { WorkerEntrypoint } from "cloudflare:workers";
import { timezoneRouter } from "./routes/timezone";
import { ipRouter } from "./routes/ip";
import { geoRouter } from "./routes/geo";
import { HonoApp, Bindings } from "./types/api";
import { clientIpMiddleware } from "./middleware/client-ip";
import { HTTPException } from "hono/http-exception";
import { textResponseMiddleware } from "./middleware/text-response";
import { healthRouter } from "./routes/health";
import { rapidAPIMiddleware } from "./middleware/rapid-api";
import { ipToTimezone } from "./services/ip";
import { getTime } from "./services/timezone";

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

app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
    },
    404,
  );
});

// Ensure sure incoming requests are from Rapid API.
app.use("*", rapidAPIMiddleware);

// Apply IP middleware to world time API routes only.
app.use("/api/timezone/*", clientIpMiddleware);
app.use("/api/ip/*", clientIpMiddleware);
app.use("/api/geo/*", clientIpMiddleware);

// Convert any call to an URL that ends with .txt to a text response.
app.use("/api/*", textResponseMiddleware);

app.get("/", (c) => {
  return c.text(
    "© 2025 World Time API. All rights reserved. Made with ❤️ for developers worldwide.",
  );
});
app.route("/api", timezoneRouter);
app.route("/api", ipRouter);
app.route("/api", geoRouter);
app.route("/api", healthRouter);

export default class WorldTimeApi extends WorkerEntrypoint<Bindings> {
  // Hono requests.
  async fetch(request: Request): Promise<Response> {
    return app.fetch(request, this.env, this.ctx);
  }

  // Service bindings.
  // See: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/.
  async getTimeByIP(clientIp: string) {
    const timezone = await ipToTimezone(this.env.DB, clientIp);

    if (!timezone) {
      throw new Error(`Couldn't find geo data for IP ${clientIp}`);
    }

    const time = getTime(timezone);
    return { ...time, client_ip: clientIp };
  }
}
