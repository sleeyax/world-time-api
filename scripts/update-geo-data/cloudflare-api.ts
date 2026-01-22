import { Cloudflare } from "cloudflare";
import { createHash } from "crypto";
import { sleep } from "./utils";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

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

async function importSqlFromFileInternal(filePath: string): Promise<void> {
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
    await pollImportStatus(importResponse.at_bookmark);
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
  await pollImportStatus(at_bookmark);

  console.log("Import completed successfully!");
}

export async function importSqlFromFile(filePath: string): Promise<void> {
  const maxRetries = 5;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await importSqlFromFileInternal(filePath);
      return; // Success, exit the retry loop
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if this is a D1_RESET_DO error
      if (errorMessage.includes("D1_RESET_DO")) {
        console.log(
          `Import failed with D1_RESET_DO error (attempt ${attempt}/${maxRetries})`,
        );
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          const delaySeconds = attempt * 2; // Exponential backoff: 2s, 4s, 6s, 8s
          console.log(`Retrying in ${delaySeconds} seconds...`);
          await sleep(delaySeconds * 1000);
          continue;
        }
      } else {
        // For other errors, throw immediately without retry
        throw error;
      }
    }
  }

  // If we get here, all retries failed
  throw new Error(
    `Import failed after ${maxRetries} attempts: ${lastError?.message}`,
  );
}

async function pollImportStatus(bookmark: string) {
  const { cloudflare, accountId, databaseId } = getCloudflareInstance();

  while (true) {
    const { error, status, messages, result, success } =
      await cloudflare.d1.database.import(databaseId, {
        account_id: accountId,
        action: "poll",
        current_bookmark: bookmark,
      });

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
      break;
    }

    if (error) {
      throw new Error(`Import failed: ${error}`);
    }

    await sleep(1000);
  }
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
