import csvParser from "csv-parser";
import { existsSync, mkdirSync, createReadStream, createWriteStream } from "fs";
import { unlink } from "fs/promises";
import { join } from "path";
import * as unzipper from "unzipper";

export function getTempDir() {
  const dir = join(process.cwd(), ".tmp");
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
  return dir;
}

/**
 * Extract the downloaded zip archive.
 */
export async function extractDatabase(filePath: string): Promise<string> {
  const extractPath = join(getTempDir(), "GeoLite2-City");
  
  // Ensure the extraction directory exists
  if (!existsSync(extractPath)) {
    mkdirSync(extractPath, { recursive: true });
  }
  
  // Files we want to extract
  const targetFiles = [
    'GeoLite2-City-Blocks-IPv4.csv',
    'GeoLite2-City-Blocks-IPv6.csv',
    'GeoLite2-City-Locations-en.csv',
    'COPYRIGHT.txt',
    'LICENSE.txt',
    'README.md'
  ];
  
  // Extract only specific files
  await createReadStream(filePath)
    .pipe(unzipper.Parse())
    .on('entry', (entry) => {
      const fileName = entry.path.split('/').pop(); // get just the filename
      
      if (targetFiles.includes(fileName || '')) {
        // Extract to the root of extractPath, not in subdirectories.
        entry.pipe(createWriteStream(join(extractPath, fileName!)));
      } else {
        entry.autodrain();
      }
    })
    .promise();
  
  return extractPath;
}

/**
 * Read the given CSV file in chunks using an async generator.
 * Use with for-await-of loop to process batches.
 */
export async function* readCsv<InputRow = any, OutputRow = unknown>(
  filePaths: string,
  rowParser: (row: InputRow) => OutputRow,
  {chunkSize, chunkCount}: {chunkSize?: number, chunkCount?: number} = {},
): AsyncGenerator<OutputRow[], void, unknown> {
  let batch: OutputRow[] = [];
  let chunkCounter = 0;

  const stream = createReadStream(filePaths).pipe(csvParser());

  for await (const value of stream) {
    const row = rowParser(value as InputRow);
    batch.push(row);

    if (chunkSize && batch.length >= chunkSize) {
      yield [...batch];
      
      batch = [];
      chunkCounter++;

      if (chunkCount && chunkCounter >= chunkCount) {
        break; // stop if we've reached the desired chunk count
      }
    }
  }

  // Yield any remaining items in the final batch
  if (batch.length > 0) {
    yield batch;
  }
}

/**
 * Clean up temporary files
 */
export function cleanup(): Promise<void> {
 return unlink(getTempDir())
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
