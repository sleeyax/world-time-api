import {
  DateTimeJsonResponse,
  DateTimeTextResponse,
  ListJsonResponse,
  ListTextResponse,
  ErrorJsonResponse,
  ErrorTextResponse,
  TimezoneParams,
  LocationParams,
  RegionParams,
  IpParams,
  TimezoneListHandler,
  TimezoneAreaHandler,
  DateTimeHandler,
  IpHandler
} from '../../src/types/api';

describe('API Types', () => {
  describe('Response Types', () => {
    it('should define DateTimeJsonResponse with required properties', () => {
      const response: DateTimeJsonResponse = {
        abbreviation: 'EST',
        client_ip: '192.168.1.1',
        datetime: '2025-01-01T12:00:00Z',
        day_of_week: 3,
        day_of_year: 1,
        dst: false,
        dst_offset: 0,
        timezone: 'America/New_York',
        unixtime: 1735732800,
        utc_datetime: '2025-01-01T17:00:00Z',
        utc_offset: '-05:00',
        week_number: 1
      };

      expect(response.abbreviation).toBe('EST');
      expect(response.client_ip).toBe('192.168.1.1');
      expect(typeof response.datetime).toBe('string');
      expect(typeof response.day_of_week).toBe('number');
      expect(typeof response.day_of_year).toBe('number');
      expect(typeof response.dst).toBe('boolean');
      expect(typeof response.dst_offset).toBe('number');
      expect(response.timezone).toBe('America/New_York');
      expect(typeof response.unixtime).toBe('number');
      expect(typeof response.utc_datetime).toBe('string');
      expect(response.utc_offset).toBe('-05:00');
      expect(typeof response.week_number).toBe('number');
    });

    it('should define DateTimeJsonResponse with optional properties', () => {
      const response: DateTimeJsonResponse = {
        abbreviation: 'EST',
        client_ip: '192.168.1.1',
        datetime: '2025-01-01T12:00:00Z',
        day_of_week: 3,
        day_of_year: 1,
        dst: true,
        dst_offset: 3600,
        timezone: 'America/New_York',
        unixtime: 1735732800,
        utc_datetime: '2025-01-01T17:00:00Z',
        utc_offset: '-05:00',
        week_number: 1,
        dst_from: '2025-03-09T07:00:00Z',
        dst_until: '2025-11-02T06:00:00Z',
        raw_offset: -18000
      };

      expect(response.dst_from).toBe('2025-03-09T07:00:00Z');
      expect(response.dst_until).toBe('2025-11-02T06:00:00Z');
      expect(response.raw_offset).toBe(-18000);
    });

    it('should define DateTimeTextResponse as string', () => {
      const response: DateTimeTextResponse = 'datetime: 2025-01-01T12:00:00Z\ntimezone: America/New_York';
      expect(typeof response).toBe('string');
    });

    it('should define ListJsonResponse as string array', () => {
      const response: ListJsonResponse = ['America/New_York', 'Europe/London'];
      expect(Array.isArray(response)).toBe(true);
      expect(response.every(item => typeof item === 'string')).toBe(true);
    });

    it('should define ListTextResponse as string', () => {
      const response: ListTextResponse = 'America/New_York\nEurope/London';
      expect(typeof response).toBe('string');
    });

    it('should define ErrorJsonResponse with error property', () => {
      const response: ErrorJsonResponse = {
        error: 'Invalid timezone'
      };
      expect(response.error).toBe('Invalid timezone');
      expect(typeof response.error).toBe('string');
    });

    it('should define ErrorTextResponse as string', () => {
      const response: ErrorTextResponse = 'Invalid timezone';
      expect(typeof response).toBe('string');
    });
  });

  describe('Request Parameter Types', () => {
    it('should define TimezoneParams with area property', () => {
      const params: TimezoneParams = {
        area: 'America'
      };
      expect(params.area).toBe('America');
      expect(typeof params.area).toBe('string');
    });

    it('should define LocationParams with area and location properties', () => {
      const params: LocationParams = {
        area: 'America',
        location: 'New_York'
      };
      expect(params.area).toBe('America');
      expect(params.location).toBe('New_York');
      expect(typeof params.area).toBe('string');
      expect(typeof params.location).toBe('string');
    });

    it('should define RegionParams with area, location and region properties', () => {
      const params: RegionParams = {
        area: 'America',
        location: 'North_Dakota',
        region: 'Center'
      };
      expect(params.area).toBe('America');
      expect(params.location).toBe('North_Dakota');
      expect(params.region).toBe('Center');
      expect(typeof params.area).toBe('string');
      expect(typeof params.location).toBe('string');
      expect(typeof params.region).toBe('string');
    });

    it('should define IpParams with ipv4 property', () => {
      const params: IpParams = {
        ipv4: '8.8.8.8'
      };
      expect(params.ipv4).toBe('8.8.8.8');
      expect(typeof params.ipv4).toBe('string');
    });
  });

  describe('Handler Types', () => {
    it('should define TimezoneListHandler function type', () => {
      const handler: TimezoneListHandler = async () => {
        return ['America/New_York', 'Europe/London'];
      };
      
      expect(typeof handler).toBe('function');
    });

    it('should define TimezoneAreaHandler function type', () => {
      const handler: TimezoneAreaHandler = async (params: TimezoneParams) => {
        return [`${params.area}/New_York`, `${params.area}/Los_Angeles`];
      };
      
      expect(typeof handler).toBe('function');
    });

    it('should define DateTimeHandler function type', () => {
      const handler: DateTimeHandler = async (params: LocationParams | RegionParams, clientIp?: string) => {
        return {
          abbreviation: 'EST',
          client_ip: clientIp || '127.0.0.1',
          datetime: '2025-01-01T12:00:00Z',
          day_of_week: 3,
          day_of_year: 1,
          dst: false,
          dst_offset: 0,
          timezone: `${params.area}/${params.location}`,
          unixtime: 1735732800,
          utc_datetime: '2025-01-01T17:00:00Z',
          utc_offset: '-05:00',
          week_number: 1
        };
      };
      
      expect(typeof handler).toBe('function');
    });

    it('should define IpHandler function type', () => {
      const handler: IpHandler = async (params?: IpParams, clientIp?: string) => {
        return {
          abbreviation: 'UTC',
          client_ip: params?.ipv4 || clientIp || '127.0.0.1',
          datetime: '2025-01-01T12:00:00Z',
          day_of_week: 3,
          day_of_year: 1,
          dst: false,
          dst_offset: 0,
          timezone: 'UTC',
          unixtime: 1735732800,
          utc_datetime: '2025-01-01T12:00:00Z',
          utc_offset: '+00:00',
          week_number: 1
        };
      };
      
      expect(typeof handler).toBe('function');
    });
  });
});
