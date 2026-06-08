import { MiddlewareHandler } from "hono";
import { formatAsText } from "../utils/formatter";

export const textResponseMiddleware: MiddlewareHandler = async (c, next) => {
  await next();

  if (
    c.req.url.endsWith(".txt") &&
    c.res.headers.get("content-type")?.includes("application/json")
  ) {
    try {
      const jsonBody = await c.res.json();
      const textBody = formatAsText(jsonBody);
      const headers = new Headers(c.res.headers);
      headers.set("Content-Type", "text/plain");
      c.res = new Response(textBody, {
        status: c.res.status,
        headers,
      });
    } catch (_) {
      // skip errors
    }
  }
};
