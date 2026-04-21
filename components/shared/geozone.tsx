/**
 * Point-in-polygon (Ray Casting) algorithm
 * coordinates: [[lat, lng], ...]
 * point: { lat, lng }
 */
export function pointInPolygon(point, coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) return false;
  const { lat, lng } = point;
  let inside = false;
  const n = coordinates.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const coord = coordinates[i];
    if (!Array.isArray(coord) || coord.length < 2) continue; // Skip invalid coordinates
    const [xi, yi] = coord;
    const coordJ = coordinates[j];
    if (!Array.isArray(coordJ) || coordJ.length < 2) continue; // Skip invalid coordinates
    const [xj, yj] = coordJ;
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Given pickup coords and a list of zones, returns the best matching zone
 * (highest priority active zone that contains the point)
 */
export function detectZone(lat, lng, zones) {
  if (!lat || !lng || !zones?.length) return null;
  const matching = zones
    .filter(z => z && z.is_active && z.tipo_zona === "poligono" && z.poligono && Array.isArray(z.poligono) && pointInPolygon({ lat, lng }, z.poligono))
    .sort((a, b) => (b?.prioridad ?? 0) - (a?.prioridad ?? 0));
  return matching[0] || null;
}

/**
 * Check if a point is inside any active red zone
 */
export function detectRedZone(lat, lng, redZones) {
  if (!lat || !lng || !redZones?.length) return null;
  return redZones.find(z => z && z.is_active && z.tipo_zona === "poligono" && z.poligono && Array.isArray(z.poligono) && pointInPolygon({ lat, lng }, z.poligono)) || null;
}

/**
 * Calculate price based on zone tariff
 */
export function calcZonePrice(zone, distanceKm) {
  if (!zone) return null;
  if (zone.tipo_tarifa === "fija" && zone.tarifa_fija) return zone.tarifa_fija;
  const base = zone.tarifa_base || 0;
  const perKm = zone.tarifa_por_km || 0;
  return base + perKm * (distanceKm || 0);
}
