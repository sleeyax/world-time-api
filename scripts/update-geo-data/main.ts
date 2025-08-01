import { readFile, writeFile } from "fs/promises";
import dotenv from "dotenv";
import { MaxMindIpBlock, MaxMindLocation } from "./types.js";
import {
  downloadMaxMindDatabase,
  getDownloadedZipPath,
  getLastModifiedDate,
} from "./maxmind-api.js";
import {
  getLastUpdated,
  importSqlFromFile,
  updateLastUpdated,
} from "./cloudflare-api.js";
import { cleanup, extractDatabase, getTempDir, readCsv } from "./utils.js";
import {
  makeSqlInsert,
  mapToGeoIp2Location,
  mapToGeoIp2Network,
} from "./mappers.js";
import { GeoIp2Location, GeoIp2Network } from "../../src/types/database.js";
import { program } from "commander";

dotenv.config();

program
  .option(
    "--chunk-size [number]",
    "Size of each chunk to read from CSV",
    parseInt
  )
  .option("--chunk-count [number]", "Number of chunks to read", parseInt)
  .option("--dump-only", "Only dump the SQL without updating the database");

program.parse(process.argv);

const options = program.opts<{
  chunkSize?: number;
  chunkCount?: number;
  dumpOnly?: boolean;
}>();

console.log("options", options);

async function main() {
  try {
    // Check if database has been updated since last run
    const cfLastModified = await getLastUpdated();
    const dbLastModified = await getLastModifiedDate();
    console.log("Database last updated:", cfLastModified ?? "never");
    if (cfLastModified != null && cfLastModified === dbLastModified) {
      console.log("No updates needed, database is already up-to-date");
      return;
    }

    // Download (or reuse existing) zip and extract the database
    const existingZipPath = getDownloadedZipPath();
    console.log(
      `${
        !existingZipPath ? "Downloading" : "Using existing"
      } MaxMind database...`
    );
    const filePath = existingZipPath ?? (await downloadMaxMindDatabase());
    console.log("Database downloaded to:", filePath);
    console.log("Extracting database...");
    const extractedPath = await extractDatabase(filePath);
    console.log("Database extracted to:", extractedPath);

    // Convert CSV files to SQL inserts
    console.log("Reading blocks...");
    const outputFile = `${getTempDir()}/${Date.now()}.sql`;
    if (options.dumpOnly) {
      // optimize writes (not supported by Cloudflare D1 so we can only do this locally)
      await writeFile(outputFile, "PRAGMA synchronous = OFF;\n", { flag: "w" });
    }
    for await (const batch of readCsv<MaxMindIpBlock, GeoIp2Network>(
      `${extractedPath}/GeoLite2-City-Blocks-IPv4.csv`,
      mapToGeoIp2Network,
      options
    )) {
      const sql = makeSqlInsert(
        batch,
        "geoip2_network",
        ["network_start", "network_end"],
        options.dumpOnly
      );

      await writeFile(outputFile, sql, { flag: "a" });
    }
    console.log("Finished reading blocks");
    console.log("Reading locations...");
    for await (const batch of readCsv<MaxMindLocation, GeoIp2Location>(
      `${extractedPath}/GeoLite2-City-Locations-en.csv`,
      mapToGeoIp2Location,
      options
    )) {
      const sql = makeSqlInsert(
        batch,
        "geoip2_location",
        ["geoname_id", "locale_code"],
        options.dumpOnly
      );

      await writeFile(outputFile, sql, { flag: "a" });
    }
    console.log("Finished reading locations");

    if (options.dumpOnly) {
      console.log("SQL dump created:", outputFile);
      return;
    }

    // Import SQL into Cloudflare D1 database
    console.log("Importing SQL into Cloudflare D1 database...");
    await importSqlFromFile(outputFile);

    // Update last updated timestamp
    console.log("Updating last updated timestamp...");
    await updateLastUpdated(dbLastModified);

    // Clean up temporary files
    // await cleanup();

    console.log("Geo location data updated successfully!");
  } catch (error) {
    console.error("Error updating geo location data:", error);
    process.exit(1);
  }
}

main().catch(console.error);
