import { getTimeZones, getTimeZonesByArea } from '../../src/services/timezone';

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
});
