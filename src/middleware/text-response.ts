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
      c.res = new Response(textBody, {
        status: c.res.status,
        headers: new Headers({
          ...c.res.headers,
          "Content-Type": "text/plain",
        }),
      });
    } catch (_) {
      // skip errors
    }
  }
};
