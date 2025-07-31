import {CityResponse, open} from 'maxmind';
import geo2lite, { GeoIpDbName } from 'geolite2-redist';

export async function lookupIP(ip: string) {
  const reader = await geo2lite.open(GeoIpDbName.City, open);
  const geo = reader.get(ip);
  reader.close();
  return geo as CityResponse | null;
}
