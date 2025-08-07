import { createWriteStream } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { getTempDir } from "./utils";

/**
 * Check when the MaxMind database was last updated
 */
export async function getLastModifiedDate() {
  const { url, headers } = getClient();

  const response = await fetch(url, {
    method: "HEAD",
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get database info: ${response.status} ${response.statusText}`,
    );
  }

  const lastModified = response.headers.get("last-modified");

  if (!lastModified) {
    throw new Error("No Last-Modified header found in response");
  }

  return lastModified;
}

/**
 * Download the MaxMind CSV database
 */
export async function downloadMaxMindDatabase(
  downloadPath: string,
): Promise<string> {
  const { url, headers } = getClient();

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download database: ${response.status} ${response.statusText}`,
    );
  }

  if (!response.body) {
    throw new Error("No response body received");
  }

  const fileStream = createWriteStream(downloadPath);
  await pipeline(response.body, fileStream);

  return downloadPath;
}

function getClient() {
  const accountId = process.env.MAXMIND_ACCOUNT_ID;
  const licenseKey = process.env.MAXMIND_LICENSE_KEY;

  if (!accountId || !licenseKey) {
    throw new Error(
      "MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY must be set in environment variables",
    );
  }

  const url =
    "https://download.maxmind.com/geoip/databases/GeoLite2-City-CSV/download?suffix=zip";
  const auth = Buffer.from(`${accountId}:${licenseKey}`).toString("base64");

  return { url, headers: { Authorization: `Basic ${auth}` } };
}

export function getDownloadedZipPath() {
  return join(getTempDir(), "GeoLite2-City.zip");
}
