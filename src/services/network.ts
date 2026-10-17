// Aliased as `net`: the network containing the IP bound to `?1`, if any.
// GeoLite2 networks never overlap, so only the first one ending at or after the IP can contain it.
// Reading only that row keeps an IP outside every network from scanning the rest of the table.
export const containingNetwork = `(
  select * from (
    select * from geoip2_network
    where network_end >= ?1
    order by network_end
    limit 1
  )
  where network_start <= ?1
) net`;
