import * as tc from "timezonecomplete";
import * as TzData from "tzdata";

// Vitest freaks out when we apply this side effect, so we ignore it when test are ran.
// We need this for the cloudflare worker runtime to pick it up though, 
// so removing it altogether is not an option unfortunately.
if (process.env.NODE_ENV !== "test") {
  tc.TzDatabase.init(TzData);
}

export { tc };
