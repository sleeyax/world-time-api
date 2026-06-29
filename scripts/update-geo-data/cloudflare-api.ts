import { Cloudflare } from "cloudflare";
import type { DatabaseImportResponse } from "cloudflare/resources/d1/database";
import { createHash } from "crypto";
import { sleep } from "./utils";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

/** Maximum number of poll attempts before giving up (~2 minutes at 1s intervals). */
const MAX_POLL_ATTEMPTS = 120;

/** Cloudflare's response when no import is currently in progress. */
const NOT_IMPORTING_ERROR = "Not currently importing anything.";

export type PollFn = (bookmark: string) => Promise<DatabaseImportResponse>;

let cachedConnectionInfo:
  | {
      cloudflareApiToken: string;
      accountId: string;
      databaseId: string;
      cloudflare: Cloudflare;
    }
  | undefined;

export async function getLastUpdated(): Promise<string | null> {
  const { cloudflare, accountId, databaseId } = getCloudflareInstance();
  const {
    result: [res],
  } = await cloudflare.d1.database.query(databaseId, {
    account_id: accountId,
    sql: "SELECT last_updated FROM geoip2_metadata LIMIT 1",
  });

  if (!res.success) {
    throw new Error("Failed to fetch last_updated from Cloudflare D1 database");
  }

  const rows = res.results ?? [];

  if (rows.length == 0) {
    return null;
  }

  const row = rows[0] as Record<string, string> | null;
  const lastUpdated = row?.["last_updated"];

  if (!lastUpdated) {
    throw new Error("No last_updated column found in Cloudflare D1 database");
  }

  return lastUpdated ?? null;
}

export async function updateLastUpdated(lastUpdated: string): Promise<void> {
  const { cloudflare, accountId, databaseId } = await getCloudflareInstance();
  const {
    result: [res],
  } = await cloudflare.d1.database.query(databaseId, {
    account_id: accountId,
    sql: "INSERT OR REPLACE INTO geoip2_metadata (last_updated) VALUES (?)",
    params: [lastUpdated],
  });

  if (!res.success) {
    throw new Error("Failed to update last_updated in Cloudflare D1 database");
  }
}

export async function importSqlFromFile(filePath: string): Promise<void> {
  const { cloudflare, accountId, databaseId } = getCloudflareInstance();

  // Compute MD5 hash of the file in a streaming way
  console.log("Creating etag...");
  const hash = createHash("md5");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve());
    stream.on("error", (err) => reject(err));
  });
  const etag = hash.digest("hex");

  // Init upload
  console.log("Initializing import with Cloudflare D1...");
  const importResponse = await cloudflare.d1.database.import(databaseId, {
    account_id: accountId,
    action: "init",
    etag,
  });
  if (importResponse.at_bookmark) {
    console.log("File already imported!");
    console.dir(importResponse, { depth: null });
    await pollImportStatus(importResponse.at_bookmark, (bm) =>
      cloudflare.d1.database.import(databaseId, {
        account_id: accountId,
        action: "poll",
        current_bookmark: bm,
      }),
    );
    return;
  }
  if (importResponse.error) {
    throw new Error(`Failed to initialize import: ${importResponse.error}`);
  }
  if (!importResponse.upload_url || !importResponse.filename) {
    throw new Error("Received empty upload URL or filename from Cloudflare D1");
  }

  // Upload to provided R2 bucket using a stream
  console.log("Uploading file to R2 bucket...");
  const fileStream = createReadStream(filePath, {
    highWaterMark: 16 * 1024 * 1024, // 16MB buffer
  });
  const { size } = await stat(filePath);
  const fetchOptions = {
    method: "PUT",
    body: fileStream as any, // Node.js stream
    duplex: "half", // Required for streaming in Node.js
    headers: {
      "Content-Length": size.toString(),
    },
  } as any; // Cast to any to bypass TS type error
  const r2Response = await fetch(importResponse.upload_url, fetchOptions);

  // Verify etag
  console.log("Verifying ETag...");
  const r2Etag = r2Response.headers.get("ETag")?.replace(/"/g, "");
  if (r2Etag !== etag) {
    throw new Error("ETag mismatch");
  }

  // Start ingestion
  console.log("Starting ingestion...");
  const { error: ingestionError, at_bookmark } =
    await cloudflare.d1.database.import(databaseId, {
      account_id: accountId,
      action: "ingest",
      filename: importResponse.filename,
      etag,
    });
  if (ingestionError) {
    throw new Error(`Failed to ingest data: ${ingestionError}`);
  }
  if (!at_bookmark) {
    throw new Error("No bookmark returned by ingestion");
  }

  // Poll import status
  console.log("Polling import status...");
  await pollImportStatus(at_bookmark, (bm) =>
    cloudflare.d1.database.import(databaseId, {
      account_id: accountId,
      action: "poll",
      current_bookmark: bm,
    }),
  );

  console.log("Import completed successfully!");
}

/**
 * Poll the Cloudflare D1 import status until it reaches a terminal state.
 *
 * Terminal states handled:
 * - `status === "complete"` → success
 * - `success === false` with `error === NOT_IMPORTING_ERROR` → success (import completed
 *   and Cloudflare already cleared the status, a common race-condition outcome)
 * - `success === false` with any other error → hard failure
 * - Exceeded `MAX_POLL_ATTEMPTS` → timeout failure
 *
 * @param bookmark  The D1 import bookmark to poll.
 * @param poll      Function that performs the actual API call. Injected for testability.
 */
export async function pollImportStatus(
  bookmark: string,
  poll: PollFn,
): Promise<void> {
  let hadActiveImport = false;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const { error, status, messages, result, success } = await poll(bookmark);

    console.dir(
      {
        status,
        result,
        success,
        error,
        messages,
      },
      { depth: null },
    );

    if (status === "complete") {
      return;
    }

    if (success) {
      hadActiveImport = true;
      await sleep(1000);
      continue;
    }

    // success is false from here on.
    if (error === NOT_IMPORTING_ERROR) {
      // Cloudflare cleared the import status. This happens when the import
      // finished (possibly between polls) or the file was already imported.
      // In all cases reaching here after a successful ingest, treat as success.
      if (hadActiveImport) {
        console.log(
          "Import completed: status cleared by Cloudflare after active polling.",
        );
      } else {
        console.log(
          "Import completed: no active import state found (completed before first poll or already imported).",
        );
      }
      return;
    }

    throw new Error(
      `Import failed: ${error ?? "unknown error"} (status: ${status ?? "unknown"}, result: ${JSON.stringify(result)})`,
    );
  }

  throw new Error(
    `Import polling timed out after ${MAX_POLL_ATTEMPTS} attempts (at least ~${MAX_POLL_ATTEMPTS}s)`,
  );
}

function getCloudflareInstance() {
  if (cachedConnectionInfo) {
    return cachedConnectionInfo;
  }

  const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN_READ_D1;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

  if (!cloudflareApiToken || !accountId || !databaseId) {
    throw new Error("Missing cloudflare environment variables");
  }

  const cloudflare = new Cloudflare({
    apiToken: cloudflareApiToken,
  });

  // Cache the connection info.
  cachedConnectionInfo = {
    cloudflare: cloudflare,
    accountId: accountId,
    databaseId: databaseId,
    cloudflareApiToken: cloudflareApiToken,
  };

  return { cloudflare, accountId, databaseId };
}
