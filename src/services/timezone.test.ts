import { DateTime } from 'timezonecomplete';
import { getTime, getTimeZones, getTimeZonesByArea } from './timezone';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { DateTimeJsonResponse } from '../types/api';
import { toISOWithMilliseconds } from '../utils/world-time-compatibility';

describe('Timezone Service', () => {
  describe('getTimeZones', () => {
    it('should return an array of timezone strings', () => {
      const timezones = getTimeZones();
      
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones).toContain('America/New_York');
      expect(timezones).toContain('Europe/London');
    });

    it('should return sorted timezones', () => {
      const timezones = getTimeZones();
      const sortedTimezones = [...timezones].sort();
      
      expect(timezones).toEqual(sortedTimezones);
    });
  });

  describe('getTimeZonesByArea', () => {
    it('should return timezones for America area', () => {
      const americaTimezones = getTimeZonesByArea('America');
      
      expect(Array.isArray(americaTimezones)).toBe(true);
      expect(americaTimezones.length).toBeGreaterThan(0);
      expect(americaTimezones.every(tz => tz.startsWith('America/'))).toBe(true);
      expect(americaTimezones).toContain('America/New_York');
    });

    it('should return timezones for Europe area', () => {
      const europeTimezones = getTimeZonesByArea('Europe');
      
      expect(Array.isArray(europeTimezones)).toBe(true);
      expect(europeTimezones.length).toBeGreaterThan(0);
      expect(europeTimezones.every(tz => tz.startsWith('Europe/'))).toBe(true);
      expect(europeTimezones).toContain('Europe/London');
    });

    it('should return empty array for non-existent area', () => {
      const nonExistentTimezones = getTimeZonesByArea('NonExistent');
      
      expect(Array.isArray(nonExistentTimezones)).toBe(true);
      expect(nonExistentTimezones.length).toBe(0);
    });

    it('should return sorted timezones', () => {
      const timezones = getTimeZonesByArea('America');
      const sortedTimezones = [...timezones].sort();
      
      expect(timezones).toEqual(sortedTimezones);
    });
  });

  describe('getTime', () => {
    const testDataDir = join(process.cwd(), 'tests', 'data', 'timezones');
    // Jest doesn't support async data passed into test.each so we must uses sync APIs here.
    const files = readdirSync(testDataDir);
    const timezones = files
      .filter(file => file.endsWith('.json'))
      .map(file => [file.replace('.json', '').replaceAll('_', '/')]);

    describe('world time api compatibility', () => {
      const getTestData = (timezone: string) => {
        const testFilePath = `${testDataDir}/${timezone.replaceAll("/", "_")}.json`;
        const testFile = readFileSync(testFilePath, 'utf-8');
        return JSON.parse(testFile) as DateTimeJsonResponse;
      }

      test.each(timezones)('should match time of %s', (timezone) => {
        const expected = getTestData(timezone);
        const utcDate = new DateTime(expected.utc_datetime);
        const actual = getTime(timezone, utcDate);
  
        expect(actual.utc_datetime).toBe(toISOWithMilliseconds(expected.utc_datetime));
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
  });
});
