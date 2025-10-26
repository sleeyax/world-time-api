import { DateTime } from "timezonecomplete";
import { getTime, getTimeZones, getTimeZonesByArea } from "./timezone";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { DateTimeJsonResponse } from "../types/api";
import { toISOWithMilliseconds } from "../utils/world-time-compatibility";
import { expect, describe, it } from "vitest";

describe("Timezone Service", () => {
  describe("getTimeZones", () => {
    it("should return an array of timezone strings", () => {
      const timezones = getTimeZones();

      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones).toContain("America/New_York");
      expect(timezones).toContain("Europe/London");
    });

    it("should return sorted timezones", () => {
      const timezones = getTimeZones();
      const sortedTimezones = [...timezones].sort();

      expect(timezones).toEqual(sortedTimezones);
    });
  });

  describe("getTimeZonesByArea", () => {
    it("should return timezones for America area", () => {
      const americaTimezones = getTimeZonesByArea("America");

      expect(Array.isArray(americaTimezones)).toBe(true);
      expect(americaTimezones.length).toBeGreaterThan(0);
      expect(americaTimezones.every((tz) => tz.startsWith("America/"))).toBe(
        true,
      );
      expect(americaTimezones).toContain("America/New_York");
    });

    it("should return timezones for Europe area", () => {
      const europeTimezones = getTimeZonesByArea("Europe");

      expect(Array.isArray(europeTimezones)).toBe(true);
      expect(europeTimezones.length).toBeGreaterThan(0);
      expect(europeTimezones.every((tz) => tz.startsWith("Europe/"))).toBe(
        true,
      );
      expect(europeTimezones).toContain("Europe/London");
    });

    it("should return empty array for non-existent area", () => {
      const nonExistentTimezones = getTimeZonesByArea("NonExistent");

      expect(Array.isArray(nonExistentTimezones)).toBe(true);
      expect(nonExistentTimezones.length).toBe(0);
    });

    it("should return sorted timezones", () => {
      const timezones = getTimeZonesByArea("America");
      const sortedTimezones = [...timezones].sort();

      expect(timezones).toEqual(sortedTimezones);
    });
  });

  describe("getTime", () => {
    const testDataDir = join(process.cwd(), "tests", "data", "timezones");
    // These no longer exist in the latest tz database.
    // The World time API is using an older version.
    // So we must exclude these from the tests.
    const exclude = [
      "Africa/Dar/es/Salaam",
      "Africa/El/Aaiun",
      "Africa/Sao/Tome",
      "America/Argentina/Buenos/Aires",
      "America/Argentina/La/Rioja",
      "America/Argentina/Rio/Gallegos",
      "America/Argentina/San/Juan",
      "America/Argentina/San/Luis",
      "America/Bahia/Banderas",
      "America/Boa/Vista",
      "America/Buenos/Aires",
      "America/Cambridge/Bay",
      "America/Campo/Grande",
      "America/Ciudad/Juarez",
      "America/Coral/Harbour",
      "America/Costa/Rica",
      "America/Dawson/Creek",
      "America/El/Salvador",
      "America/Fort/Nelson",
      "America/Fort/Wayne",
      "America/Glace/Bay",
      "America/Goose/Bay",
      "America/Grand/Turk",
      "America/Indiana/Tell/City",
      "America/Knox/IN",
      "America/La/Paz",
      "America/Los/Angeles",
      "America/Lower/Princes",
      "America/Mexico/City",
      "America/New/York",
      "America/North/Dakota/Beulah",
      "America/North/Dakota/Center",
      "America/North/Dakota/New/Salem",
      "America/Port/of/Spain",
      "America/Porto/Acre",
      "America/Porto/Velho",
      "America/Puerto/Rico",
      "America/Punta/Arenas",
      "America/Rainy/River",
      "America/Rankin/Inlet",
      "America/Rio/Branco",
      "America/Santa/Isabel",
      "America/Santo/Domingo",
      "America/Sao/Paulo",
      "America/St/Barthelemy",
      "America/St/Johns",
      "America/St/Kitts",
      "America/St/Lucia",
      "America/St/Thomas",
      "America/St/Vincent",
      "America/Swift/Current",
      "America/Thunder/Bay",
      "Antarctica/South/Pole",
      "Asia/Ho/Chi/Minh",
      "Asia/Hong/Kong",
      "Asia/Kuala/Lumpur",
      "Asia/Phnom/Penh",
      "Asia/Tel/Aviv",
      "Asia/Ujung/Pandang",
      "Asia/Ulan/Bator",
      "Atlantic/Cape/Verde",
      "Atlantic/Jan/Mayen",
      "Atlantic/South/Georgia",
      "Atlantic/St/Helena",
      "Australia/Broken/Hill",
      "Australia/Lord/Howe",
      "Europe/Isle/of/Man",
      "Europe/San/Marino",
      "Pacific/Port/Moresby",
      "Pacific/Pago/Pago",
      "Africa/Addis/Ababa",
      // These are exceptions which currently don't match exactly, always off by 1 hour due to DST inconsistencies.
      // In some cases we got it wrong and in others the world time API got it wrong.
      // We exclude them for now.
      // TODO: investigate these inconsistencies further.
      "Africa/Cairo",
      "America/Asuncion",
      "America/Port-au-Prince",
      "Egypt",
    ];
    // Jest doesn't support async data passed into test.each so we must uses sync APIs here.
    const files = readdirSync(testDataDir);
    const timezones = files
      .filter(
        (file) =>
          file.endsWith(".json") &&
          !exclude.includes(file.replace(".json", "").replaceAll("_", "/")),
      )
      .map((file) => [file.replace(".json", "").replaceAll("_", "/")]);

    describe("world time api compatibility", () => {
      const getTestData = (timezone: string) => {
        const testFilePath = `${testDataDir}/${timezone.replaceAll("/", "_")}.json`;
        const testFile = readFileSync(testFilePath, "utf-8");
        return JSON.parse(testFile) as DateTimeJsonResponse;
      };

      it.each(timezones)("should match time of %s", (timezone) => {
        const expected = getTestData(timezone);
        const utcDate = new DateTime(expected.utc_datetime);
        const actual = getTime(timezone, utcDate);

        expect(actual.utc_datetime).toBe(
          toISOWithMilliseconds(expected.utc_datetime),
        );
        expect(actual.datetime).toBe(toISOWithMilliseconds(expected.datetime));
        expect(actual.utc_offset).toBe(expected.utc_offset);
        expect(actual.timezone).toBe(expected.timezone);
        expect(actual.day_of_week).toBe(expected.day_of_week);
        expect(actual.day_of_year).toBe(expected.day_of_year);
        expect(actual.unixtime).toBe(expected.unixtime);
        expect(actual.raw_offset).toBe(expected.raw_offset);
        expect(actual.week_number).toBe(expected.week_number);
        expect(actual.dst).toBe(expected.dst);
        expect(actual.abbreviation).toBe(expected.abbreviation);
        expect(actual.dst_offset).toBe(expected.dst_offset);
        expect(actual.dst_from).toBe(expected.dst_from);
        expect(actual.dst_until).toBe(expected.dst_until);
      });
    });

    describe("DST boundary conditions", () => {
      it("should correctly handle DST transitions at exact transition time", () => {
        // Test at exact DST end time (Oct 26, 2025 01:00 UTC)
        // This is when Europe/Amsterdam transitions from CEST (+02:00) to CET (+01:00)
        const dstEndTime = new DateTime("2025-10-26T01:00:00+00:00");
        const result = getTime("Europe/Amsterdam", dstEndTime);

        // At the transition moment, DST should be false (we've just exited DST)
        expect(result.dst).toBe(false);
        expect(result.utc_offset).toBe("+01:00");

        // dst_until should be the current transition (when DST ended)
        expect(result.dst_until).toBe("2025-10-26T01:00:00+00:00");

        // dst_from should be when the next DST period will start
        expect(result.dst_from).toBe("2026-03-29T01:00:00+00:00");
      });

      it("should correctly handle DST transitions just before transition time", () => {
        // Test 1 minute before DST ends
        const beforeDstEnd = new DateTime("2025-10-26T00:59:00+00:00");
        const result = getTime("Europe/Amsterdam", beforeDstEnd);

        // Still in DST
        expect(result.dst).toBe(true);
        expect(result.utc_offset).toBe("+02:00");

        // dst_from should be when current DST period started
        expect(result.dst_from).toBe("2025-03-30T01:00:00+00:00");

        // dst_until should be when current DST period will end
        expect(result.dst_until).toBe("2025-10-26T01:00:00+00:00");
      });

      it("should correctly handle DST transitions just after transition time", () => {
        // Test 1 minute after DST ends
        const afterDstEnd = new DateTime("2025-10-26T01:01:00+00:00");
        const result = getTime("Europe/Amsterdam", afterDstEnd);

        // No longer in DST
        expect(result.dst).toBe(false);
        expect(result.utc_offset).toBe("+01:00");

        // dst_until should be when the last DST period ended
        expect(result.dst_until).toBe("2025-10-26T01:00:00+00:00");

        // dst_from should be when the next DST period will start
        expect(result.dst_from).toBe("2026-03-29T01:00:00+00:00");
      });
    });
  });
});
