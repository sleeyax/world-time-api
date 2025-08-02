import { readdir, readFile, writeFile } from "fs/promises";
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
    parseInt,
  )
  .option("--chunk-count [number]", "Number of chunks to read", (v) =>
    parseInt(v),
  )
  .option(
    "--max-rows [number]",
    "Maximum amount of row values per insert statement (default = 250)",
    (v) => parseInt(v),
    250,
  )
  .option(
    "--dump-only",
    "Whether to only dump the SQL without pushing to the remote",
  )
  .option("--split-files", "Whether to split output into multiple files")
  .option(
    "--add-transaction",
    "Whether to wrap statements in a transaction (local only)",
  )
  .option("--optimize-writes", "Whether to optimize writes (local only)");

program.parse(process.argv);

const options = program.opts<{
  chunkSize?: number;
  chunkCount?: number;
  dumpOnly?: boolean;
  splitFiles?: boolean;
  maxRows?: number;
  addTransaction?: boolean;
  optimizeWrites?: boolean;
}>();

console.log("options", options);

async function main() {
  try {
    // Check if database has been updated since last run
    const cfLastModified = options.dumpOnly ? "" : await getLastUpdated();
    const dbLastModified = options.dumpOnly ? "" : await getLastModifiedDate();
    if (!options.dumpOnly) {
      console.log("Database last updated:", cfLastModified ?? "never");
      if (cfLastModified != null && cfLastModified === dbLastModified) {
        console.log("No updates needed, database is already up-to-date");
        return;
      }
    }

    // Skip if the the temporary directory contains any SQL files already
    const hasSQLDumps = (await readdir(getTempDir())).some((file) =>
      file.endsWith(".sql"),
    );
    let outputFile = generateOutputFile();
    if (!hasSQLDumps) {
      // Download (or reuse existing) zip and extract the database
      const existingZipPath = getDownloadedZipPath();
      console.log(
        `${
          !existingZipPath ? "Downloading" : "Using existing"
        } MaxMind database...`,
      );
      const filePath = existingZipPath ?? (await downloadMaxMindDatabase());
      console.log("Database downloaded to:", filePath);
      console.log("Extracting database...");
      const extractedPath = await extractDatabase(filePath);
      console.log("Database extracted to:", extractedPath);

      // Convert CSV files to SQL inserts
      console.log("Reading blocks...");
      if (options.optimizeWrites && !options.splitFiles) {
        await writeFile(outputFile, "PRAGMA synchronous = OFF;\n", {
          flag: "w",
        });
      }
      for await (const batch of readCsv<MaxMindIpBlock, GeoIp2Network>(
        `${extractedPath}/GeoLite2-City-Blocks-IPv4.csv`,
        mapToGeoIp2Network,
        options,
      )) {
        const sql = makeSqlInsert({
          data: batch,
          tableName: "geoip2_network",
          onConflict: ["network_start", "network_end"],
          addTransaction: options.addTransaction,
          maxValuesEach: options.maxRows,
        });

        if (options.splitFiles) {
          if (options.optimizeWrites) {
            await writeFile(outputFile, "PRAGMA synchronous = OFF;\n", {
              flag: "w",
            });
          }
          await writeFile(outputFile, sql, {
            flag: "w",
          });

          outputFile = generateOutputFile();
        } else {
          await writeFile(outputFile, sql, {
            flag: "a",
          });
        }
      }
      console.log("Finished reading blocks");
      console.log("Reading locations...");
      for await (const batch of readCsv<MaxMindLocation, GeoIp2Location>(
        `${extractedPath}/GeoLite2-City-Locations-en.csv`,
        mapToGeoIp2Location,
        options,
      )) {
        const sql = makeSqlInsert({
          data: batch,
          tableName: "geoip2_location",
          onConflict: ["geoname_id", "locale_code"],
          addTransaction: options.addTransaction,
          maxValuesEach: options.maxRows,
        });

        if (options.splitFiles) {
          if (options.optimizeWrites) {
            await writeFile(outputFile, "PRAGMA synchronous = OFF;\n", {
              flag: "w",
            });
          }
          await writeFile(outputFile, sql, {
            flag: "w",
          });

          outputFile = generateOutputFile();
        } else {
          await writeFile(outputFile, sql, {
            flag: "a",
          });
        }
      }
      console.log("Finished reading locations");
    } else {
      console.log(
        "SQL dump files already exist, skipping CSV to SQL conversion",
      );
    }

    if (options.dumpOnly) {
      console.log("SQL dump file(s) written to:", getTempDir());
      return;
    }

    // Import SQL into Cloudflare D1 database
    console.log("Importing SQL file(s) to Cloudflare D1 database...");
    if (options.splitFiles) {
      // walk the temp directory and import each file
      const files = await readdir(getTempDir());
      for (const file of files) {
        if (!file.endsWith(".sql")) continue; // only import SQL files
        const filePath = `${getTempDir()}/${file}`;
        console.log(`Importing ${filePath}...`);
        await importSqlFromFile(filePath);
      }
    } else {
      await importSqlFromFile(outputFile);
    }

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

const generateOutputFile = () => `${getTempDir()}/${Date.now()}.sql`;

main().catch(console.error);
