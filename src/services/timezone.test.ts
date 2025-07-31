import { DateTime } from 'timezonecomplete';
import { getTime, getTimeZones, getTimeZonesByArea } from './timezone';
import * as tc from "timezonecomplete";

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
    it('should get time of America/Chicago', () => {
      const area = 'America';
      const location = 'Chicago';
      // 2025-07-31 13:00:00
      var utcDate = new DateTime(2025, 7, 31, 13, 0, 0, 0, tc.utc());
      const time = getTime([area, location], utcDate);
      
      expect(time.utc_datetime).toMatch("2025-07-31T13:00:00.000+00:00");
      expect(time.datetime).toMatch("2025-07-31T08:00:00.000-05:00");
      expect(time.utc_offset).toMatch("-05:00");
      expect(time.timezone).toBe('America/Chicago');
      expect(time.day_of_week).toBe(4);
      expect(time.day_of_year).toBe(212);
      expect(time.unixtime).toBe(1753966800000);
      expect(time.raw_offset).toBe(-21600);
      expect(time.week_number).toBe(31);
      expect(time.dst).toBe(true);
      expect(time.abbreviation).toBe('CDT');
      expect(time.dst_offset).toBe(3600);
      expect(time.dst_from).toBe("2025-03-09T08:00:00.000+00:00");
      expect(time.dst_until).toBe("2025-11-02T07:00:00.000+00:00");
    });
  });
});
