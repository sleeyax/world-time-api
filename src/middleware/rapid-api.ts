import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const rapidAPIMiddleware: MiddlewareHandler = async (c) => {
  const headerKey = "X-RapidAPI-Proxy-Secret";
  const key = c.req.header(headerKey);
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && key !== process.env.RAPID_API_SECRET) {
    throw new HTTPException(401, {
      message: "Unauthorized",
      cause: `Invalid or missing ${headerKey} header`,
    });
  }
};
