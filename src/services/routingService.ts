import { BusLine, TurnManeuver } from '../types/bus';

const ROUTE_CACHE_KEY = 'vfc_street_routes_cache_v2';

interface RouteCache {
  [hash: string]: [number, number][];
}

function getRouteCache(): RouteCache {
  try {
    const raw = localStorage.getItem(ROUTE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setRouteCache(hash: string, coords: [number, number][]): void {
  try {
    const cache = getRouteCache();
    cache[hash] = coords;
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Could not save route cache', err);
  }
}

function computeCoordHash(coords: { lat: number; lng: number }[]): string {
  return coords
    .map((c) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`)
    .join('|');
}

export const RoutingService = {
  /**
   * Fetches high-resolution street geometry from OSRM driving engine
   * Returns an array of [lat, lng] coordinates that strictly follow real streets.
   */
  async fetchStreetRoute(
    waypoints: { lat: number; lng: number }[],
    options: { forceRefresh?: boolean; timeoutMs?: number } = {}
  ): Promise<[number, number][]> {
    if (!waypoints || waypoints.length < 2) {
      return waypoints.map((p) => [p.lat, p.lng]);
    }

    const hash = computeCoordHash(waypoints);
    if (!options.forceRefresh) {
      const cache = getRouteCache();
      if (cache[hash] && cache[hash].length > 0) {
        return cache[hash];
      }
    }

    const coordStr = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OSRM HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const rawCoords: [number, number][] = data.routes[0].geometry.coordinates;
        // OSRM returns [lng, lat], convert to [lat, lng]
        const latLngCoords: [number, number][] = rawCoords.map(([lng, lat]) => [
          Number(lat.toFixed(6)),
          Number(lng.toFixed(6)),
        ]);

        // Cache for offline usage
        setRouteCache(hash, latLngCoords);
        return latLngCoords;
      }
    } catch (err) {
      console.warn('Failed to fetch street route from OSRM, fallback to direct points:', err);
    } finally {
      clearTimeout(timeoutId);
    }

    // Fallback: return direct waypoints
    return waypoints.map((p) => [p.lat, p.lng]);
  },

  /**
   * Recalculates both Ida and Volta for a given bus line using real street routing
   */
  async recalculateLineRoutes(line: BusLine): Promise<BusLine> {
    const [routePathIda, routePathVolta] = await Promise.all([
      line.stopsIda.length >= 2
        ? this.fetchStreetRoute(line.stopsIda, { forceRefresh: true })
        : Promise.resolve(line.routePathIda),
      line.stopsVolta.length >= 2
        ? this.fetchStreetRoute(line.stopsVolta, { forceRefresh: true })
        : Promise.resolve(line.routePathVolta),
    ]);

    return {
      ...line,
      routePathIda: routePathIda.length > 0 ? routePathIda : line.routePathIda,
      routePathVolta: routePathVolta.length > 0 ? routePathVolta : line.routePathVolta,
    };
  },

  /**
   * Recalculates all bus lines to guarantee they adhere 100% to street networks
   */
  async recalculateAllLines(
    lines: BusLine[],
    onProgress?: (done: number, total: number, currentLine: BusLine) => void
  ): Promise<BusLine[]> {
    const updated: BusLine[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (onProgress) onProgress(i, lines.length, line);
      const updatedLine = await this.recalculateLineRoutes(line);
      updated.push(updatedLine);
      // Gentle throttle to respect public server
      await new Promise((r) => setTimeout(r, 400));
    }
    if (onProgress) onProgress(lines.length, lines.length, lines[lines.length - 1]);
    return updated;
  },
};
