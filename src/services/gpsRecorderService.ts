import { RecordedGpsTrack, BusLine, BusStop } from '../types/bus';
import { StorageService } from './storage';
import { calculateDistanceMeters } from './geoUtils';
import { RoutingService } from './routingService';

export interface GpsRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  points: [number, number][]; // [lat, lng]
  markedStops: { id: string; lat: number; lng: number; name: string; order: number }[];
  totalDistanceKm: number;
  durationSeconds: number;
  currentAccuracy: number | null;
  currentSpeedKmh: number;
  lastCoord: [number, number] | null;
  startTime: number | null;
}

type Listener = (state: GpsRecorderState) => void;

class GpsRecorderManager {
  private state: GpsRecorderState = {
    isRecording: false,
    isPaused: false,
    points: [],
    markedStops: [],
    totalDistanceKm: 0,
    durationSeconds: 0,
    currentAccuracy: null,
    currentSpeedKmh: 0,
    lastCoord: null,
    startTime: null,
  };

  private listeners: Set<Listener> = new Set();
  private timerId: any = null;
  private watchId: number | null = null;
  private lastRecordedTime: number = 0;

  getState(): GpsRecorderState {
    return { ...this.state };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  startRecording() {
    if (this.state.isRecording) return;

    this.state = {
      isRecording: true,
      isPaused: false,
      points: [],
      markedStops: [],
      totalDistanceKm: 0,
      durationSeconds: 0,
      currentAccuracy: null,
      currentSpeedKmh: 0,
      lastCoord: null,
      startTime: Date.now(),
    };
    this.lastRecordedTime = Date.now();

    // Start timer for duration
    this.timerId = setInterval(() => {
      if (!this.state.isPaused && this.state.isRecording) {
        this.state.durationSeconds += 1;
        this.notify();
      }
    }, 1000);

    // Request Screen Wake Lock to prevent mobile screen from turning off during route recording
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        this.wakeLock = lock;
      }).catch((err: any) => {
        console.warn('Wake Lock request failed:', err);
      });
    }

    // Start Geolocation watcher if supported
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        this.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (this.state.isPaused || !this.state.isRecording) return;
            const { latitude, longitude, accuracy, speed } = pos.coords;
            const kmh = speed !== null && speed >= 0 ? Math.round(speed * 3.6) : 0;
            this.addPoint(latitude, longitude, accuracy, kmh);
          },
          (err) => {
            console.warn('GPS recorder error:', err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000,
          }
        );
      } catch (e) {
        console.warn('Could not start GPS watcher:', e);
      }
    }

    this.notify();
  }

  private wakeLock: any = null;

  pauseRecording() {
    if (!this.state.isRecording) return;
    this.state.isPaused = true;
    this.notify();
  }

  resumeRecording() {
    if (!this.state.isRecording) return;
    this.state.isPaused = false;
    this.notify();
  }

  stopRecording(): RecordedGpsTrack | null {
    if (!this.state.isRecording) return null;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }

    const recordedTrack: RecordedGpsTrack = {
      id: 'gps-track-' + Date.now(),
      name: `Trajeto Gravado ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date().toISOString(),
      points: [...this.state.points],
      markedStops: [...this.state.markedStops],
      totalDistanceKm: Number(this.state.totalDistanceKm.toFixed(2)),
      durationSeconds: this.state.durationSeconds,
    };

    if (recordedTrack.points.length >= 2) {
      StorageService.saveRecordedTrack(recordedTrack);
    }

    this.state.isRecording = false;
    this.state.isPaused = false;
    this.notify();

    return recordedTrack;
  }

  reset() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
    this.state = {
      isRecording: false,
      isPaused: false,
      points: [],
      markedStops: [],
      totalDistanceKm: 0,
      durationSeconds: 0,
      currentAccuracy: null,
      currentSpeedKmh: 0,
      lastCoord: null,
      startTime: null,
    };
    this.notify();
  }

  /**
   * Ingest a point (from real GPS watcher or simulator)
   * Applies minimum distance threshold (~4 meters) to prevent duplicate points when stopped
   */
  addPoint(lat: number, lng: number, accuracy?: number | null, speedKmh = 0) {
    if (!this.state.isRecording || this.state.isPaused) return;

    this.state.currentAccuracy = typeof accuracy === 'number' ? Math.round(accuracy) : null;
    this.state.currentSpeedKmh = speedKmh;

    const last = this.state.lastCoord;
    if (last) {
      const distMeters = calculateDistanceMeters(last[0], last[1], lat, lng);
      // Minimum movement distance to record a new waypoint
      if (distMeters < 3.5) {
        return;
      }
      this.state.totalDistanceKm += distMeters / 1000;
    }

    const newCoord: [number, number] = [lat, lng];
    this.state.points.push(newCoord);
    this.state.lastCoord = newCoord;
    this.notify();
  }

  markStopAtCurrentLocation(customName?: string) {
    if (!this.state.lastCoord) return;
    const order = this.state.markedStops.length + 1;
    const name = customName?.trim() || `Parada Gravada #${order}`;
    const newStop = {
      id: 'marked-stop-' + Date.now(),
      lat: this.state.lastCoord[0],
      lng: this.state.lastCoord[1],
      name,
      order,
    };
    this.state.markedStops.push(newStop);
    this.notify();
    return newStop;
  }

  /**
   * Copies recorded points directly to a BusLine (Ida or Volta)
   * Option to calibrate with OSRM street network or keep raw GPS path
   */
  async copyTrackToLine(
    lineId: string,
    direction: 'ida' | 'volta',
    options: {
      snapToStreets?: boolean;
      importMarkedStops?: boolean;
    } = {}
  ): Promise<{ success: boolean; message: string; updatedLine?: BusLine }> {
    const lines = StorageService.getLines();
    const line = lines.find((l) => l.id === lineId);
    if (!line) {
      return { success: false, message: 'Linha não encontrada.' };
    }

    let finalPoints = [...this.state.points];
    if (finalPoints.length < 2) {
      return { success: false, message: 'O trajeto gravado precisa de pelo menos 2 pontos.' };
    }

    // If snapToStreets requested and we have points
    if (options.snapToStreets && finalPoints.length >= 2) {
      try {
        // Sample waypoints to not overflow OSRM URL: take start, end, and up to 25 evenly spaced points
        const sampled: { lat: number; lng: number }[] = [];
        const step = Math.max(1, Math.floor(finalPoints.length / 25));
        for (let i = 0; i < finalPoints.length; i += step) {
          sampled.push({ lat: finalPoints[i][0], lng: finalPoints[i][1] });
        }
        // Ensure last point is included
        const lastPt = finalPoints[finalPoints.length - 1];
        if (
          sampled[sampled.length - 1].lat !== lastPt[0] ||
          sampled[sampled.length - 1].lng !== lastPt[1]
        ) {
          sampled.push({ lat: lastPt[0], lng: lastPt[1] });
        }

        const snapped = await RoutingService.fetchStreetRoute(sampled, { forceRefresh: true });
        if (snapped && snapped.length > 5) {
          finalPoints = snapped;
        }
      } catch (err) {
        console.warn('Could not snap track to streets with OSRM, using raw GPS track:', err);
      }
    }

    // Build updated line
    const updatedLine: BusLine = {
      ...line,
      routePathIda: direction === 'ida' ? finalPoints : line.routePathIda,
      routePathVolta: direction === 'volta' ? finalPoints : line.routePathVolta,
    };

    // If importMarkedStops
    if (options.importMarkedStops && this.state.markedStops.length > 0) {
      const newBusStops: BusStop[] = this.state.markedStops.map((ms, idx) => ({
        id: 'stop-gps-' + Date.now() + '-' + idx,
        name: ms.name,
        lat: ms.lat,
        lng: ms.lng,
        order: idx + 1,
        isTerminal: idx === 0 || idx === this.state.markedStops.length - 1,
        landmark: 'Coletado via GPS em Trânsito',
      }));

      if (direction === 'ida') {
        updatedLine.stopsIda = newBusStops;
      } else {
        updatedLine.stopsVolta = newBusStops;
      }
    }

    StorageService.updateLine(updatedLine);

    // Save as track in history as well
    const track: RecordedGpsTrack = {
      id: 'gps-applied-' + Date.now(),
      name: `Trajeto Aplicado na Linha ${line.code} (${direction.toUpperCase()})`,
      timestamp: new Date().toISOString(),
      lineCode: line.code,
      direction,
      points: finalPoints,
      markedStops: [...this.state.markedStops],
      totalDistanceKm: Number(this.state.totalDistanceKm.toFixed(2)),
      durationSeconds: this.state.durationSeconds,
    };
    StorageService.saveRecordedTrack(track);

    return {
      success: true,
      message: `Trajeto copiado com sucesso para a Linha ${line.code} (${direction === 'ida' ? 'Sentido Ida' : 'Sentido Volta'}) com ${finalPoints.length} pontos!`,
      updatedLine,
    };
  }
}

export const gpsRecorderService = new GpsRecorderManager();
