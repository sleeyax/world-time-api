import { Cloudflare } from "cloudflare";
import { createHash } from "crypto";
import { sleep } from "./utils";
import { createReadStream } from "fs";
import { promises as fsPromises } from "fs";

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
  const {
    upload_url,
    filename,
    error: importError,
  } = await cloudflare.d1.database.import(databaseId, {
    account_id: accountId,
    action: "init",
    etag,
  });
  if (importError) {
    throw new Error(`Failed to initialize import: ${importError}`);
  }
  if (!upload_url || !filename) {
    throw new Error("Received empty upload URL or filename from Cloudflare D1");
  }

  // Upload to provided R2 bucket using a stream
  console.log("Uploading file to R2 bucket...");
  const fileStream = createReadStream(filePath, {
    highWaterMark: 16 * 1024 * 1024, // 16MB buffer
  });
  const { size } = await fsPromises.stat(filePath);
  const fetchOptions = {
    method: "PUT",
    body: fileStream as any, // Node.js stream
    duplex: "half", // Required for streaming in Node.js
    headers: {
      "Content-Length": size.toString(),
    },
  } as any; // Cast to any to bypass TS type error
  const r2Response = await fetch(upload_url, fetchOptions);

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
      filename,
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
  while (true) {
    const { success, error, status } = await cloudflare.d1.database.import(
      databaseId,
      {
        account_id: accountId,
        action: "poll",
        current_bookmark: at_bookmark,
      }
    );
    console.log(`Import status: ${status}`);

    const doneMessage = "Not currently importing anything.";
    const isDone = success || (!success && error === doneMessage);

    if (isDone) {
      break;
    }

    if (error && error !== doneMessage) {
      throw new Error(`Import failed: ${error}`);
    }

    await sleep(1000);
  }

  console.log("Import completed successfully!");
}

function getCloudflareInstance() {
  if (cachedConnectionInfo) {
    return cachedConnectionInfo;
  }

  const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN_NO_WRANGLER;
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
