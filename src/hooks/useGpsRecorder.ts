import { useState, useEffect, useCallback } from 'react';
import { gpsRecorderService, GpsRecorderState } from '../services/gpsRecorderService';
import { BusLine } from '../types/bus';

export function useGpsRecorder() {
  const [state, setState] = useState<GpsRecorderState>(() => gpsRecorderService.getState());

  useEffect(() => {
    return gpsRecorderService.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  const startRecording = useCallback(() => {
    gpsRecorderService.startRecording();
  }, []);

  const pauseRecording = useCallback(() => {
    gpsRecorderService.pauseRecording();
  }, []);

  const resumeRecording = useCallback(() => {
    gpsRecorderService.resumeRecording();
  }, []);

  const stopRecording = useCallback(() => {
    return gpsRecorderService.stopRecording();
  }, []);

  const reset = useCallback(() => {
    gpsRecorderService.reset();
  }, []);

  const addPoint = useCallback((lat: number, lng: number, accuracy?: number | null, speedKmh = 0) => {
    gpsRecorderService.addPoint(lat, lng, accuracy, speedKmh);
  }, []);

  const markStop = useCallback((customName?: string) => {
    return gpsRecorderService.markStopAtCurrentLocation(customName);
  }, []);

  const copyToLine = useCallback(
    async (
      lineId: string,
      direction: 'ida' | 'volta',
      options?: { snapToStreets?: boolean; importMarkedStops?: boolean }
    ) => {
      return await gpsRecorderService.copyTrackToLine(lineId, direction, options);
    },
    []
  );

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
    addPoint,
    markStop,
    copyToLine,
  };
}
