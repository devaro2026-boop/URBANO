import { BusLine, BusVehicle, IncidentReport, ActiveTrip, RecordedGpsTrack } from '../types/bus';
import { INITIAL_BUS_LINES, INITIAL_VEHICLES } from '../data/mockFortalezaLines';
import { TursoService } from './tursoService';

const STORAGE_KEYS = {
  LINES: 'vfc_bus_lines_v4',
  VEHICLES: 'vfc_bus_vehicles_v2',
  INCIDENTS: 'vfc_incidents_v1',
  ACTIVE_TRIP: 'vfc_active_trip_v1',
  SETTINGS: 'vfc_settings_v1',
  RECORDED_TRACKS: 'vfc_gps_tracks_v1',
};

export interface DriverSettings {
  soundAlerts: boolean;
  voiceAnnouncements: boolean;
  speedWarning: boolean;
  highContrastNight: boolean;
  autoAdvanceStops: boolean;
  geofenceRadiusMeters: number; // default 55m
  driverName: string;
}

const DEFAULT_SETTINGS: DriverSettings = {
  soundAlerts: true,
  voiceAnnouncements: true,
  speedWarning: true,
  highContrastNight: false,
  autoAdvanceStops: true,
  geofenceRadiusMeters: 55,
  driverName: 'Francisco Chagas (Mat. 4812)',
};

export const StorageService = {
  async initTursoSync(): Promise<void> {
    try {
      // Economical fetch: only pull from Turso if local storage is missing items
      const remoteLines = await TursoService.get(STORAGE_KEYS.LINES);
      if (remoteLines && Array.isArray(remoteLines) && remoteLines.length > 0) {
        const local = localStorage.getItem(STORAGE_KEYS.LINES);
        if (!local) {
          localStorage.setItem(STORAGE_KEYS.LINES, JSON.stringify(remoteLines));
          window.dispatchEvent(new CustomEvent('vfc_lines_updated'));
        }
      } else {
        // Push initial to Turso if remote empty
        const local = localStorage.getItem(STORAGE_KEYS.LINES);
        if (local) {
          await TursoService.set(STORAGE_KEYS.LINES, JSON.parse(local));
        } else {
          localStorage.setItem(STORAGE_KEYS.LINES, JSON.stringify(INITIAL_BUS_LINES));
          await TursoService.set(STORAGE_KEYS.LINES, INITIAL_BUS_LINES);
        }
      }

      const remoteVehicles = await TursoService.get(STORAGE_KEYS.VEHICLES);
      if (remoteVehicles && Array.isArray(remoteVehicles) && remoteVehicles.length > 0) {
        const local = localStorage.getItem(STORAGE_KEYS.VEHICLES);
        if (!local) {
          localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(remoteVehicles));
          window.dispatchEvent(new CustomEvent('vfc_vehicles_updated'));
        }
      } else {
        const local = localStorage.getItem(STORAGE_KEYS.VEHICLES);
        if (local) {
          await TursoService.set(STORAGE_KEYS.VEHICLES, JSON.parse(local));
        } else {
          localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
          await TursoService.set(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
        }
      }

      const remoteSettings = await TursoService.get(STORAGE_KEYS.SETTINGS);
      if (remoteSettings) {
        const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!local) {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(remoteSettings));
          window.dispatchEvent(new CustomEvent('vfc_settings_updated'));
        }
      }
    } catch (e) {
      console.error('Turso sync background error:', e);
    }
  },

  getLines(): BusLine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LINES);
      if (!raw) {
        this.saveLines(INITIAL_BUS_LINES);
        return INITIAL_BUS_LINES;
      }
      const parsed: BusLine[] = JSON.parse(raw);
      let needsMigration = false;
      const initialMap = new Map(INITIAL_BUS_LINES.map((l) => [l.id, l]));

      const migrated = parsed.map((line) => {
        const initial = initialMap.get(line.id);
        if (initial && (!line.routePathIda || line.routePathIda.length < 30)) {
          needsMigration = true;
          return {
            ...line,
            routePathIda: initial.routePathIda,
            routePathVolta: initial.routePathVolta,
          };
        }
        return line;
      });

      if (needsMigration) {
        this.saveLines(migrated);
        return migrated;
      }
      return parsed;
    } catch {
      return INITIAL_BUS_LINES;
    }
  },

  forceUpdateWithStreetPaths(): BusLine[] {
    const initialMap = new Map(INITIAL_BUS_LINES.map((l) => [l.id, l]));
    const current = this.getLines();
    const updated = current.map((l) => {
      const init = initialMap.get(l.id);
      if (init) {
        return {
          ...l,
          routePathIda: init.routePathIda,
          routePathVolta: init.routePathVolta,
        };
      }
      return l;
    });
    this.saveLines(updated);
    return updated;
  },

  saveLines(lines: BusLine[]): void {
    localStorage.setItem(STORAGE_KEYS.LINES, JSON.stringify(lines));
    window.dispatchEvent(new CustomEvent('vfc_lines_updated'));
    // Economical background sync to Turso
    TursoService.set(STORAGE_KEYS.LINES, lines).catch(() => {});
  },

  updateLine(updatedLine: BusLine): void {
    const lines = this.getLines();
    const updated = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
    this.saveLines(updated);
  },

  deleteLine(lineId: string): void {
    const lines = this.getLines();
    const updated = lines.filter((l) => l.id !== lineId);
    this.saveLines(updated);
  },

  createLine(newLine: BusLine): void {
    const lines = this.getLines();
    const updated = [newLine, ...lines];
    this.saveLines(updated);
  },

  getVehicles(): BusVehicle[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      if (!raw) {
        this.saveVehicles(INITIAL_VEHICLES);
        return INITIAL_VEHICLES;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_VEHICLES;
    }
  },

  saveVehicles(vehicles: BusVehicle[]): void {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    window.dispatchEvent(new CustomEvent('vfc_vehicles_updated'));
    TursoService.set(STORAGE_KEYS.VEHICLES, vehicles).catch(() => {});
  },

  getIncidents(): IncidentReport[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveIncident(report: IncidentReport): void {
    const list = this.getIncidents();
    const updated = [report, ...list];
    localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('vfc_incidents_updated'));
    TursoService.set(STORAGE_KEYS.INCIDENTS, updated).catch(() => {});
  },

  getActiveTrip(): ActiveTrip | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRIP);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveActiveTrip(trip: ActiveTrip | null): void {
    if (trip) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP, JSON.stringify(trip));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
    }
    window.dispatchEvent(new CustomEvent('vfc_trip_updated'));
  },

  getSettings(): DriverSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: DriverSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('vfc_settings_updated'));
    TursoService.set(STORAGE_KEYS.SETTINGS, settings).catch(() => {});
  },

  getRecordedTracks(): RecordedGpsTrack[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECORDED_TRACKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveRecordedTrack(track: RecordedGpsTrack): void {
    const list = this.getRecordedTracks();
    const updated = [track, ...list.filter((t) => t.id !== track.id)];
    localStorage.setItem(STORAGE_KEYS.RECORDED_TRACKS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('vfc_recorded_tracks_updated'));
  },

  deleteRecordedTrack(trackId: string): void {
    const list = this.getRecordedTracks();
    const updated = list.filter((t) => t.id !== trackId);
    localStorage.setItem(STORAGE_KEYS.RECORDED_TRACKS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('vfc_recorded_tracks_updated'));
  },

  clearRecordedTracks(): void {
    localStorage.removeItem(STORAGE_KEYS.RECORDED_TRACKS);
    window.dispatchEvent(new CustomEvent('vfc_recorded_tracks_updated'));
  },

  exportDatabaseJSON(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      company: 'Viação Fortaleza',
      lines: this.getLines(),
      vehicles: this.getVehicles(),
      incidents: this.getIncidents(),
      settings: this.getSettings(),
      recordedTracks: this.getRecordedTracks(),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabaseJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.lines)) {
        this.saveLines(parsed.lines);
      }
      if (Array.isArray(parsed.vehicles)) {
        this.saveVehicles(parsed.vehicles);
      }
      if (Array.isArray(parsed.incidents)) {
        localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(parsed.incidents));
        TursoService.set(STORAGE_KEYS.INCIDENTS, parsed.incidents).catch(() => {});
      }
      if (Array.isArray(parsed.recordedTracks)) {
        localStorage.setItem(STORAGE_KEYS.RECORDED_TRACKS, JSON.stringify(parsed.recordedTracks));
      }
      return { success: true, message: 'Dados importados e sincronizados com Turso!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: 'Arquivo JSON inválido: ' + msg };
    }
  },

  resetToDefaults(): void {
    this.saveLines(INITIAL_BUS_LINES);
    this.saveVehicles(INITIAL_VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
    localStorage.removeItem(STORAGE_KEYS.RECORDED_TRACKS);
  },
};
