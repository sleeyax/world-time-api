import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

const masterKeys = parseMasterKeys(process.env.MASTER_KEYS);

function parseMasterKeys(raw: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!raw) return map;
  for (const pair of raw.split(",")) {
    const idx = pair.indexOf(":");
    if (idx <= 0) continue;
    const name = pair.slice(0, idx).trim();
    const key = pair.slice(idx + 1).trim();
    if (name && key) map.set(key, name);
  }
  return map;
}

export const rapidAPIMiddleware: MiddlewareHandler = async (c, next) => {
  if (c.req.path === "/api/ping") {
    return next();
  }

  if (process.env.NODE_ENV === "development") {
    return next();
  }

  const masterKey = c.req.header("x-master-key");
  if (masterKey) {
    const name = masterKeys.get(masterKey);
    if (name) {
      console.log(`auth: master key '${name}'`);
      return next();
    }
  }

  const headerKey = "X-RapidAPI-Proxy-Secret";
  const key = c.req.header(headerKey);
  if (key !== process.env.RAPID_API_SECRET) {
    throw new HTTPException(401, {
      message: "Unauthorized",
      cause: `Invalid or missing ${headerKey} header`,
    });
  }

  await next();
};
