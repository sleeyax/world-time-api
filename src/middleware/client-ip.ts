import { MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/cloudflare-workers";

export const clientIpMiddleware: MiddlewareHandler = async (c, next) => {
  await next();

  // Only modify JSON responses.
  if (c.res.headers.get("content-type")?.includes("application/json")) {
    try {
      const jsonBody = (await c.res.json()) as any;

      // Skip error responses or if client_ip is already set.
      // Also skip if the response is not a JSON object.
      if (
        !jsonBody.client_ip &&
        !jsonBody.error &&
        typeof jsonBody === "object"
      ) {
        const clientIp = getConnInfo(c).remote.address ?? "127.0.0.1";
        jsonBody.client_ip = clientIp;
      }

      c.res = new Response(JSON.stringify(jsonBody), {
        status: c.res.status,
        headers: c.res.headers,
      });
    } catch (_) {
      // skip errors
    }
  }
};
