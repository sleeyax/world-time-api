import { access, readFile, writeFile } from "fs/promises";

const rootDir = "tests/data";

async function main() {
  console.log("Started downloading data from worldtimeapi.org...");
  const timezones = await getTimeZones();
  for (const timezone of timezones) {
    await getTimezone(timezone);
  }
  console.log("All time zones downloaded successfully.");
}

main().catch(console.error);

async function getTimeZones() {
  const cacheKey = `${rootDir}/timezones.json`;

  if (await fileExists(cacheKey)) {
    console.log("Using cached time zones from timezones.json");
    const data = await readFile(cacheKey, "utf-8");
    return JSON.parse(data);
  }

  const res = await fetch("http://worldtimeapi.org/api/timezone");
  if (!res.ok) {
    throw new Error(`Failed to fetch time zones: ${res.statusText}`);
  }

  const timeZones = await res.json();

  await writeFile(cacheKey, JSON.stringify(timeZones, null, 2));

  return timeZones;
}

async function getTimezone(zone: string) {
  const cacheKey = `${rootDir}/timezones/${zone.replaceAll("/", "_")}.json`;

  if (await fileExists(cacheKey)) {
    console.log(`Using cached timezone data for ${zone}`);
    const data = await readFile(cacheKey, "utf-8");
    return JSON.parse(data);
  }

  const res = await fetch(`http://worldtimeapi.org/api/timezone/${zone}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch timezone ${zone}: ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  delete data.client_ip; // let's not dox ourselves
  console.log(data);

  await writeFile(cacheKey, JSON.stringify(data, null, 2));

  return data;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}
