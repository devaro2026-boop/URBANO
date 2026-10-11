// Geolocation and navigation utility functions

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360; // in degrees
}

export function estimateETAminutes(distanceMeters: number, currentSpeedKmh = 25): number {
  const speed = Math.max(currentSpeedKmh, 15); // minimum realistic bus city speed
  const hours = distanceMeters / (speed * 1000);
  return Math.max(1, Math.round(hours * 60));
}

// Generate smooth interpolated points along a polyline for test simulator
export function generateSubPoints(
  path: [number, number][],
  subdivisionFactor = 8
): [number, number][] {
  if (path.length < 2) return path;
  const result: [number, number][] = [];

  // Adapt factor based on path resolution so simulator remains fast and silky smooth
  const effectiveFactor =
    path.length > 400 ? 2 : path.length > 150 ? 3 : subdivisionFactor;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    for (let s = 0; s < effectiveFactor; s++) {
      const frac = s / effectiveFactor;
      const lat = p1[0] + (p2[0] - p1[0]) * frac;
      const lng = p1[1] + (p2[1] - p1[1]) * frac;
      result.push([lat, lng]);
    }
  }
  result.push(path[path.length - 1]);
  return result;
}
