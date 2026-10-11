import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Bus,
  Compass,
  Navigation,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Users,
  Clock,
  ArrowRight,
  MapPin,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  ShieldAlert,
  Send,
  Sliders,
  CheckCircle,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  GitMerge,
  RotateCw,
  Milestone,
  Route,
  ListOrdered,
  Calendar,
  X,
  Search,
  Check,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Radio,
  Edit3,
} from 'lucide-react';
import { BusLine, BusStop, IncidentReport, TurnManeuver } from '../types/bus';
import { soundService } from '../services/audio';
import { StorageService, DriverSettings } from '../services/storage';
import { RoutingService } from '../services/routingService';
import { GpsTrackRecorderWidget } from './GpsTrackRecorderWidget';
import { EditLineModal } from './EditLineModal';
import { useGpsRecorder } from '../hooks/useGpsRecorder';
import {
  calculateDistanceMeters,
  formatDistance,
  calculateBearing,
  estimateETAminutes,
  generateSubPoints,
} from '../services/geoUtils';

interface DriverNavigationProps {
  selectedLine: BusLine;
  onSelectLine: (lineId: string) => void;
  allLines: BusLine[];
  settings: DriverSettings;
  onUpdateSettings: (settings: DriverSettings) => void;
}

export const DriverNavigation: React.FC<DriverNavigationProps> = ({
  selectedLine,
  onSelectLine,
  allLines,
  settings,
  onUpdateSettings,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeCasingLayerRef = useRef<L.Polyline | null>(null);
  const routeLineLayerRef = useRef<L.Polyline | null>(null);
  const routeDashedLayerRef = useRef<L.Polyline | null>(null);
  const stopMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const maneuverMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const terminalsLayerRef = useRef<L.LayerGroup | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const recordedGpsLayerRef = useRef<L.LayerGroup | null>(null);

  // Direction: 'ida' or 'volta'
  const [direction, setDirection] = useState<'ida' | 'volta'>('ida');
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [currentManeuverIndex, setCurrentManeuverIndex] = useState(0);
  const [isFollowingBus, setIsFollowingBus] = useState(false); // starts free so entire route is shown!
  const [mapTheme, setMapTheme] = useState<'streets' | 'dark'>('streets');
  const [showStopsList, setShowStopsList] = useState(false);
  const [showStreetsModal, setShowStreetsModal] = useState(false);
  const [showItineraryPortalModal, setShowItineraryPortalModal] = useState(false);
  const [searchLineId, setSearchLineId] = useState<string>(selectedLine.id);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showEditLineModal, setShowEditLineModal] = useState(false);
  const [showGpsRecorderWidget, setShowGpsRecorderWidget] = useState(false);
  const [routeTracedBanner, setRouteTracedBanner] = useState(false);
  const [isSnappingStreets, setIsSnappingStreets] = useState(false);
  const [streetSnapBanner, setStreetSnapBanner] = useState(false);
  const [isMobileCockpitExpanded, setIsMobileCockpitExpanded] = useState(false);
  const [isCleanMapMode, setIsCleanMapMode] = useState(false);
  const [showMobileRouteMenu, setShowMobileRouteMenu] = useState(false);

  // GPS Recorder hook
  const { points: gpsPoints, markedStops: gpsMarkedStops, isRecording: isGpsRecording } = useGpsRecorder();

  // Recalculates line route with OSRM street-following engine
  const handleSnapToStreets = async () => {
    setIsSnappingStreets(true);
    try {
      const updated = await RoutingService.recalculateLineRoutes(selectedLine);
      const allCurrentLines = StorageService.getLines();
      const updatedAll = allCurrentLines.map((l) => (l.id === updated.id ? updated : l));
      StorageService.saveLines(updatedAll);
      setStreetSnapBanner(true);
      setTimeout(() => setStreetSnapBanner(false), 4000);
      fitRouteOnMap();
    } catch (err) {
      console.error('Erro ao calibrar ruas:', err);
    } finally {
      setIsSnappingStreets(false);
    }
  };

  // GPS & Simulation state
  const [gpsMode, setGpsMode] = useState<'real' | 'simulated'>('simulated');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);
  const [simStepIndex, setSimStepIndex] = useState(0);

  // Telemetry
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [currentHeading, setCurrentHeading] = useState(0); // degrees
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(() => {
    return selectedLine.routePathIda[0] || [-3.7745, -38.5630];
  });
  const [passengerCount, setPassengerCount] = useState(24);
  const [incidentType, setIncidentType] = useState<IncidentReport['type']>('transito_intenso');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentSuccess, setIncidentSuccess] = useState(false);

  // Active stops, maneuvers and path based on direction
  const activeStops = useMemo(() => {
    return direction === 'ida' ? selectedLine.stopsIda : selectedLine.stopsVolta;
  }, [direction, selectedLine]);

  const activeManeuvers = useMemo(() => {
    return direction === 'ida' ? selectedLine.maneuversIda || [] : selectedLine.maneuversVolta || [];
  }, [direction, selectedLine]);

  const activeStreets = useMemo(() => {
    return direction === 'ida' ? selectedLine.streetListIda || [] : selectedLine.streetListVolta || [];
  }, [direction, selectedLine]);

  const activePath = useMemo(() => {
    return direction === 'ida' ? selectedLine.routePathIda : selectedLine.routePathVolta;
  }, [direction, selectedLine]);

  // Interpolated smooth path for simulator
  const simDetailedPath = useMemo(() => {
    return generateSubPoints(activePath, 10);
  }, [activePath]);

  // Current Next Stop
  const nextStop: BusStop | undefined = activeStops[currentStopIndex];
  const isTripFinished = currentStopIndex >= activeStops.length;

  // Next Upcoming Maneuver (Quais ruas entrar)
  const nextManeuver: TurnManeuver | undefined = activeManeuvers[currentManeuverIndex] || activeManeuvers[0];

  // Distance and ETA to next stop
  const { distanceToNextStop, etaMinutes } = useMemo(() => {
    if (!nextStop) return { distanceToNextStop: 0, etaMinutes: 0 };
    const dist = calculateDistanceMeters(
      currentCoords[0],
      currentCoords[1],
      nextStop.lat,
      nextStop.lng
    );
    const eta = estimateETAminutes(dist, currentSpeed || 25);
    return { distanceToNextStop: dist, etaMinutes: eta };
  }, [currentCoords, nextStop, currentSpeed]);

  // Distance to next maneuver
  const distanceToNextManeuver = useMemo(() => {
    if (!nextManeuver) return 0;
    return calculateDistanceMeters(
      currentCoords[0],
      currentCoords[1],
      nextManeuver.lat,
      nextManeuver.lng
    );
  }, [currentCoords, nextManeuver]);

  // Speed warning threshold
  const isOverSpeed = currentSpeed > selectedLine.speedLimit;

  // Helper for turn icons
  const renderTurnIcon = (turnType: TurnManeuver['turnType']) => {
    switch (turnType) {
      case 'turn-right':
        return <CornerUpRight className="w-5 h-5 text-emerald-400" />;
      case 'turn-left':
        return <CornerUpLeft className="w-5 h-5 text-emerald-400" />;
      case 'merge':
        return <GitMerge className="w-5 h-5 text-sky-400" />;
      case 'roundabout':
        return <RotateCw className="w-5 h-5 text-amber-400" />;
      case 'terminal':
        return <Bus className="w-5 h-5 text-amber-400" />;
      case 'straight':
      default:
        return <ArrowUp className="w-5 h-5 text-emerald-400" />;
    }
  };

  // Helper to fit entire route on the map
  const fitRouteOnMap = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || activePath.length === 0) return;

    map.invalidateSize();
    const bounds = L.latLngBounds(activePath);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
    }
    setRouteTracedBanner(true);
    setTimeout(() => setRouteTracedBanner(false), 3000);
  }, [activePath]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: activePath[0] || [-3.7745, -38.5630],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile layers
      const tileUrl =
        mapTheme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      });
      tileLayer.addTo(map);

      mapInstanceRef.current = map;
      stopMarkersLayerRef.current = L.layerGroup().addTo(map);
      maneuverMarkersLayerRef.current = L.layerGroup().addTo(map);
      terminalsLayerRef.current = L.layerGroup().addTo(map);
      recordedGpsLayerRef.current = L.layerGroup().addTo(map);

      // Initial fit to route
      setTimeout(() => {
        map.invalidateSize();
        if (activePath.length > 0) {
          const bounds = L.latLngBounds(activePath);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
          }
        }
      }, 200);
    }
  }, []);

  // Live render of recorded GPS polyline trail on map
  useEffect(() => {
    const layer = recordedGpsLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (gpsPoints.length >= 2) {
      // Glow background
      const glow = L.polyline(gpsPoints, {
        color: '#a855f7',
        weight: 12,
        opacity: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      });
      // Bright dotted/neon track
      const trail = L.polyline(gpsPoints, {
        color: '#f43f5e',
        weight: 5,
        dashArray: '6, 10',
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layer.addLayer(glow);
      layer.addLayer(trail);
    }

    // Marked stops during GPS recording
    gpsMarkedStops.forEach((stop) => {
      const stopHtml = `
        <div class="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-black text-[10px] shadow-lg border-2 border-white flex items-center gap-1 whitespace-nowrap">
          <span>📍 ${stop.name}</span>
        </div>
      `;
      const icon = L.divIcon({
        className: 'custom-gps-stop-marker',
        html: stopHtml,
        iconAnchor: [30, 25],
      });
      const marker = L.marker([stop.lat, stop.lng], { icon, zIndexOffset: 850 });
      layer.addLayer(marker);
    });
  }, [gpsPoints, gpsMarkedStops]);


  // Update map tiles when theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl =
      mapTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
  }, [mapTheme]);

  // KEY: Whenever line or direction changes, reset coordinates and fit bounds to the route!
  useEffect(() => {
    if (activePath.length > 0) {
      setCurrentCoords(activePath[0]);
      setCurrentStopIndex(0);
      setCurrentManeuverIndex(0);
      setSimStepIndex(0);
      setIsSimulating(false);
      setSearchLineId(selectedLine.id);

      const map = mapInstanceRef.current;
      if (map) {
        map.invalidateSize();
        const bounds = L.latLngBounds(activePath);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
        }
      }
    }
  }, [selectedLine.id, direction]);

  // Redraw High-Visibility Route Polylines and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || activePath.length === 0) return;

    // Remove existing route polylines
    if (routeCasingLayerRef.current) map.removeLayer(routeCasingLayerRef.current);
    if (routeLineLayerRef.current) map.removeLayer(routeLineLayerRef.current);
    if (routeDashedLayerRef.current) map.removeLayer(routeDashedLayerRef.current);

    // 1. Dark glowing casing polyline
    const casing = L.polyline(activePath, {
      color: '#020617',
      weight: 12,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeCasingLayerRef.current = casing;

    // 2. High-contrast vibrant primary route line
    const polyline = L.polyline(activePath, {
      color: selectedLine.color || '#ea580c',
      weight: 7,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeLineLayerRef.current = polyline;

    // 3. Inner bright dashed guidance line (like modern GPS navigation)
    const dashed = L.polyline(activePath, {
      color: '#ffffff',
      weight: 3,
      dashArray: '6, 12',
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeDashedLayerRef.current = dashed;

    // Redraw Start & End Terminal Badges
    if (terminalsLayerRef.current) {
      terminalsLayerRef.current.clearLayers();

      const startCoord = activePath[0];
      const endCoord = activePath[activePath.length - 1];

      // Start Badge
      const startHtml = `
        <div class="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-2xl border-2 border-white flex items-center gap-1.5 whitespace-nowrap">
          <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span>PARTIDA: ${selectedLine.origin}</span>
        </div>
      `;
      const startIcon = L.divIcon({
        className: 'custom-terminal-marker',
        html: startHtml,
        iconAnchor: [60, 30],
      });
      L.marker(startCoord, { icon: startIcon, zIndexOffset: 900 }).addTo(terminalsLayerRef.current);

      // Destination Badge
      const endHtml = `
        <div class="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs shadow-2xl border-2 border-white flex items-center gap-1.5 whitespace-nowrap">
          <span>🏁 CHEGADA: ${selectedLine.destination}</span>
        </div>
      `;
      const endIcon = L.divIcon({
        className: 'custom-terminal-marker',
        html: endHtml,
        iconAnchor: [60, 30],
      });
      L.marker(endCoord, { icon: endIcon, zIndexOffset: 900 }).addTo(terminalsLayerRef.current);
    }

    // Redraw Stop Markers
    if (stopMarkersLayerRef.current) {
      stopMarkersLayerRef.current.clearLayers();

      activeStops.forEach((stop, idx) => {
        const isNext = idx === currentStopIndex;
        const isPassed = idx < currentStopIndex;
        const isTerminal = stop.isTerminal;

        let markerHtml = '';
        if (isNext) {
          markerHtml = `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full bg-emerald-500 opacity-75 animate-ping"></span>
              <div class="relative w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs">
                ${stop.order}
              </div>
            </div>
          `;
        } else if (isPassed) {
          markerHtml = `
            <div class="w-6 h-6 rounded-full bg-slate-400/80 border border-white shadow-md flex items-center justify-center text-white font-medium text-[10px]">
              ✓
            </div>
          `;
        } else if (isTerminal) {
          markerHtml = `
            <div class="w-7 h-7 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950 font-bold text-xs">
              ★
            </div>
          `;
        } else {
          markerHtml = `
            <div class="w-6 h-6 rounded-full bg-slate-800 border-2 border-white shadow-md flex items-center justify-center text-white font-semibold text-[11px]">
              ${stop.order}
            </div>
          `;
        }

        const icon = L.divIcon({
          className: 'custom-stop-marker',
          html: markerHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([stop.lat, stop.lng], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-900 font-sans">
            <p class="font-bold text-sm">${stop.name}</p>
            <p class="text-xs text-slate-600">${stop.street || stop.landmark || 'Parada de Ônibus'}</p>
            <p class="text-[11px] text-emerald-700 font-semibold mt-1">Parada ${stop.order} de ${activeStops.length}</p>
          </div>
        `);
        marker.addTo(stopMarkersLayerRef.current!);
      });
    }

    // Draw Turn Maneuvers on Map
    if (maneuverMarkersLayerRef.current) {
      maneuverMarkersLayerRef.current.clearLayers();

      activeManeuvers.forEach((m, idx) => {
        const isCurrentManeuver = idx === currentManeuverIndex;
        const maneuverHtml = `
          <div class="flex items-center justify-center px-1.5 py-0.5 rounded-lg ${
            isCurrentManeuver
              ? 'bg-emerald-500 text-white shadow-lg ring-2 ring-white scale-110 font-bold'
              : 'bg-slate-900/90 text-emerald-400 border border-slate-700 font-semibold'
          } text-[10px] whitespace-nowrap">
            <span>↳ ${idx + 1}. ${m.streetName}</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-maneuver-marker',
          html: maneuverHtml,
          iconAnchor: [20, 10],
        });

        const marker = L.marker([m.lat, m.lng], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-900 font-sans">
            <p class="font-bold text-xs text-emerald-700">Conversão #${idx + 1}</p>
            <p class="font-semibold text-sm">${m.instruction}</p>
            <p class="text-xs text-slate-600 font-mono mt-0.5">Rua: ${m.streetName}</p>
          </div>
        `);
        marker.addTo(maneuverMarkersLayerRef.current!);
      });
    }

    // Auto-fit to route polyline
    map.invalidateSize();
    const bounds = polyline.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [activePath, activeStops, activeManeuvers, currentStopIndex, currentManeuverIndex, selectedLine]);

  // Update Driver Bus Marker on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const busHtml = `
      <div class="relative flex items-center justify-center" style="transform: rotate(${currentHeading}deg); transition: transform 0.3s ease;">
        <div class="w-10 h-10 rounded-2xl bg-emerald-600 border-2 border-white shadow-2xl flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"></path>
            <path d="M15 6v6"></path>
            <path d="M2 12h19.6"></path>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.6-.5-1-1-1H3c-.5 0-1 .4-1 1 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"></path>
            <circle cx="7" cy="18" r="2"></circle>
            <circle cx="17" cy="18" r="2"></circle>
          </svg>
        </div>
        <div class="absolute -top-1 w-2.5 h-2.5 bg-white rotate-45 border-t border-l border-emerald-600"></div>
      </div>
    `;

    const busIcon = L.divIcon({
      className: 'driver-bus-icon',
      html: busHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!busMarkerRef.current) {
      busMarkerRef.current = L.marker(currentCoords, { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
      accuracyCircleRef.current = L.circle(currentCoords, {
        radius: 30,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
    } else {
      busMarkerRef.current.setLatLng(currentCoords);
      busMarkerRef.current.setIcon(busIcon);
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(currentCoords);
      }
    }

    // Auto-center ONLY if follow mode is active
    if (isFollowingBus) {
      map.panTo(currentCoords, { animate: true, duration: 0.5 });
    }
  }, [currentCoords, currentHeading, isFollowingBus]);

  // Voice announcement for upcoming street maneuver
  const handleSpeakManeuver = useCallback(() => {
    if (!nextManeuver) return;
    soundService.playChime();
    setTimeout(() => {
      soundService.speak(`Atenção motorista: ${nextManeuver.instruction}.`);
    }, 400);
  }, [nextManeuver]);

  // Voice / Audio Stop Announcement handler
  const handleAnnounceStop = useCallback(() => {
    if (!nextStop) return;
    soundService.announceStop(nextStop.name, nextStop.isTerminal, nextStop.street || nextStop.landmark);
  }, [nextStop]);

  // Advance to next stop
  const handleAdvanceStop = useCallback(() => {
    if (currentStopIndex < activeStops.length - 1) {
      const nextIdx = currentStopIndex + 1;
      setCurrentStopIndex(nextIdx);
      const target = activeStops[nextIdx];
      if (settings.voiceAnnouncements && target) {
        soundService.announceStop(target.name, target.isTerminal, target.street || target.landmark);
      }
    } else {
      setCurrentStopIndex(activeStops.length); // finished
      if (settings.voiceAnnouncements) {
        soundService.speak('Fim de viagem. Obrigado a todos os passageiros.');
      }
    }
  }, [currentStopIndex, activeStops, settings.voiceAnnouncements]);

  // Advance to next maneuver
  const handleAdvanceManeuver = useCallback(() => {
    if (currentManeuverIndex < activeManeuvers.length - 1) {
      const nextIdx = currentManeuverIndex + 1;
      setCurrentManeuverIndex(nextIdx);
      const target = activeManeuvers[nextIdx];
      if (settings.voiceAnnouncements && target) {
        soundService.speak(`Atenção: ${target.instruction}.`);
      }
    }
  }, [currentManeuverIndex, activeManeuvers, settings.voiceAnnouncements]);

  // Real GPS Geolocation Watcher
  useEffect(() => {
    if (gpsMode !== 'real') return;

    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada neste navegador.');
      setGpsMode('simulated');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        const newCoords: [number, number] = [latitude, longitude];

        // Speed in km/h
        const kmh = speed !== null && speed >= 0 ? Math.round(speed * 3.6) : 0;
        setCurrentSpeed(kmh);

        // Heading
        if (heading !== null && !isNaN(heading)) {
          setCurrentHeading(heading);
        } else {
          const b = calculateBearing(currentCoords[0], currentCoords[1], latitude, longitude);
          if (b) setCurrentHeading(b);
        }

        setCurrentCoords(newCoords);

        // Speed warning sound
        if (settings.speedWarning && kmh > selectedLine.speedLimit) {
          soundService.playSpeedWarning();
        }

        // Auto-advance if close to next stop
        if (settings.autoAdvanceStops && nextStop) {
          const dist = calculateDistanceMeters(latitude, longitude, nextStop.lat, nextStop.lng);
          if (dist <= settings.geofenceRadiusMeters) {
            handleAdvanceStop();
          }
        }

        // Auto-advance maneuver if close to turn point
        if (nextManeuver) {
          const distMan = calculateDistanceMeters(latitude, longitude, nextManeuver.lat, nextManeuver.lng);
          if (distMan <= 50) {
            handleAdvanceManeuver();
          }
        }
      },
      (err) => {
        console.warn('Erro GPS:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [
    gpsMode,
    currentCoords,
    settings.speedWarning,
    settings.autoAdvanceStops,
    settings.geofenceRadiusMeters,
    selectedLine.speedLimit,
    nextStop,
    nextManeuver,
    handleAdvanceStop,
    handleAdvanceManeuver,
  ]);

  // Simulator step interval
  useEffect(() => {
    if (gpsMode !== 'simulated' || !isSimulating) return;

    const intervalTime = Math.max(100, Math.round(600 / simSpeedMultiplier));
    const interval = setInterval(() => {
      setSimStepIndex((prev) => {
        const nextIdx = prev + 1;
        if (nextIdx >= simDetailedPath.length) {
          setIsSimulating(false);
          return prev;
        }

        const prevPoint = simDetailedPath[prev];
        const nextPoint = simDetailedPath[nextIdx];

        // Calculate heading
        const heading = calculateBearing(prevPoint[0], prevPoint[1], nextPoint[0], nextPoint[1]);
        setCurrentHeading(heading);
        setCurrentCoords(nextPoint);

        // Simulated speed
        const baseSpeed = 38 + Math.floor(Math.sin(nextIdx / 3) * 12);
        setCurrentSpeed(baseSpeed);

        // Check if approaching next stop
        if (nextStop) {
          const dist = calculateDistanceMeters(
            nextPoint[0],
            nextPoint[1],
            nextStop.lat,
            nextStop.lng
          );
          if (dist <= settings.geofenceRadiusMeters) {
            handleAdvanceStop();
          }
        }

        // Check if approaching next maneuver
        if (nextManeuver) {
          const distMan = calculateDistanceMeters(
            nextPoint[0],
            nextPoint[1],
            nextManeuver.lat,
            nextManeuver.lng
          );
          if (distMan <= 45) {
            handleAdvanceManeuver();
          }
        }

        return nextIdx;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [
    gpsMode,
    isSimulating,
    simSpeedMultiplier,
    simDetailedPath,
    nextStop,
    nextManeuver,
    settings.geofenceRadiusMeters,
    handleAdvanceStop,
    handleAdvanceManeuver,
  ]);

  // Reset simulator to origin
  const handleResetSimulator = () => {
    setIsSimulating(false);
    setSimStepIndex(0);
    setCurrentStopIndex(0);
    setCurrentManeuverIndex(0);
    if (activePath.length > 0) {
      setCurrentCoords(activePath[0]);
      setCurrentHeading(0);
      setCurrentSpeed(0);
    }
  };

  // Submit Incident to CCO
  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: IncidentReport = {
      id: 'inc-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lineCode: selectedLine.code,
      vehiclePrefix: selectedLine.activePrefix || '02501',
      driverName: settings.driverName,
      type: incidentType,
      description: incidentDesc || 'Alerta registrado pelo motorista durante itinerário.',
      location: { lat: currentCoords[0], lng: currentCoords[1] },
      status: 'pendente',
    };

    StorageService.saveIncident(newReport);
    setIncidentSuccess(true);
    setTimeout(() => {
      setIncidentSuccess(false);
      setShowIncidentModal(false);
      setIncidentDesc('');
    }, 1500);
  };

  const lineBeingConsulted = allLines.find((l) => l.id === searchLineId) || selectedLine;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Driver Bar: Responsive (compact on mobile, rich on desktop) */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 z-10 shadow-md">
        {/* Mobile View: Sleek compact header */}
        <div className="flex sm:hidden items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={fitRouteOnMap}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-md flex-shrink-0"
              style={{ backgroundColor: selectedLine.color }}
              title="Enquadrar no mapa"
            >
              {selectedLine.code}
            </button>
            <div className="min-w-0">
              <h2 className="font-extrabold text-xs text-white truncate leading-tight">
                {selectedLine.code} - {selectedLine.name}
              </h2>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {activePath.length} pts • {selectedLine.activePrefix || '02501'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Direction toggle compact */}
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center text-[11px]">
              <button
                onClick={() => {
                  setDirection('ida');
                  setCurrentStopIndex(0);
                  setCurrentManeuverIndex(0);
                  setSimStepIndex(0);
                }}
                className={`px-2 py-0.5 font-bold rounded-md transition ${
                  direction === 'ida'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ida
              </button>
              <button
                onClick={() => {
                  setDirection('volta');
                  setCurrentStopIndex(0);
                  setCurrentManeuverIndex(0);
                  setSimStepIndex(0);
                }}
                className={`px-2 py-0.5 font-bold rounded-md transition ${
                  direction === 'volta'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Volta
              </button>
            </div>

            {/* Toggle Clean Map Mode */}
            <button
              onClick={() => setIsCleanMapMode(!isCleanMapMode)}
              className={`p-1.5 rounded-lg border transition ${
                isCleanMapMode
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title={isCleanMapMode ? 'Restaurar painéis' : 'Modo Mapa Limpo (esconder painéis)'}
            >
              {isCleanMapMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Mobile Actions Drawer Trigger */}
            <button
              onClick={() => setShowMobileRouteMenu(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-md"
              title="Ações da Linha e Ferramentas"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ações</span>
            </button>
          </div>
        </div>

        {/* Desktop View: Full detailed line header */}
        <div className="hidden sm:flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md cursor-pointer hover:scale-105 transition"
            style={{ backgroundColor: selectedLine.color }}
            onClick={fitRouteOnMap}
            title="Clique para enquadrar a rota no mapa"
          >
            {selectedLine.code}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-white tracking-tight">
                Linha {selectedLine.code} - {selectedLine.name}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {selectedLine.operatingDays || 'Dias úteis'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Carro: <strong className="text-slate-200">{selectedLine.activePrefix || '02501'}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{activePath.length} pontos traçados</span>
              <span>•</span>
              <span>Frequência: <strong className="text-slate-200">{selectedLine.frequencyMinutes} min</strong></span>
            </p>
          </div>
        </div>

        {/* Desktop Action Controls & Line Selector */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Button: "Consultar Itinerário" */}
          <button
            onClick={() => setShowItineraryPortalModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            title="Abrir tela oficial de consulta de itinerário (viacaofortaleza.com.br)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Consultar Itinerário</span>
          </button>

          {/* Button: "Traçar Rota no Mapa" */}
          <button
            onClick={fitRouteOnMap}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            title="Enquadrar e traçar rota completa da linha no mapa"
          >
            <Route className="w-3.5 h-3.5" />
            <span>Traçar no Mapa</span>
          </button>

          {/* Button: "Copiar Trajeto GPS" */}
          <button
            onClick={() => setShowGpsRecorderWidget(!showGpsRecorderWidget)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition ${
              isGpsRecording
                ? 'bg-purple-600 text-white animate-pulse'
                : 'bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-purple-200 hover:text-white'
            }`}
            title="Gravar trajeto percorrido pelo ônibus e copiar diretamente para a linha no mapa"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>{isGpsRecording ? 'Gravando GPS...' : 'Copiar Trajeto GPS'}</span>
          </button>

          {/* Button: "Editar Rota" */}
          <button
            onClick={() => setShowEditLineModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            title="Editar código, nome, itinerário e traçado desta linha"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Editar Rota</span>
          </button>

          {/* Button: "100% nas Ruas (OSRM)" */}
          <button
            onClick={handleSnapToStreets}
            disabled={isSnappingStreets}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            title="Calibrar traçado 100% sobre as vias e ruas reais com OSRM"
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>{isSnappingStreets ? 'Calibrando...' : '100% nas Ruas'}</span>
          </button>

          {/* Direction toggle desktop */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => {
                setDirection('ida');
                setCurrentStopIndex(0);
                setCurrentManeuverIndex(0);
                setSimStepIndex(0);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                direction === 'ida'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ida
            </button>
            <button
              onClick={() => {
                setDirection('volta');
                setCurrentStopIndex(0);
                setCurrentManeuverIndex(0);
                setSimStepIndex(0);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                direction === 'volta'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Volta
            </button>
          </div>

          {/* Quick Line Selector */}
          <select
            value={selectedLine.id}
            onChange={(e) => {
              onSelectLine(e.target.value);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500 max-w-[170px] truncate"
          >
            {allLines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.code} - {line.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Cockpit Area: Map + Overlay HUD */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* GPS Track Recorder & Copier Widget */}
        {showGpsRecorderWidget && (
          <GpsTrackRecorderWidget
            currentLine={selectedLine}
            allLines={allLines}
            currentCoords={currentCoords}
            isSimulatingBus={isSimulating}
            onLineUpdated={() => {
              fitRouteOnMap();
            }}
            onClose={() => setShowGpsRecorderWidget(false)}
          />
        )}

        {/* Temporary banner when route is traced */}
        {routeTracedBanner && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <Check className="w-4 h-4" />
            <span>Rota da Linha {selectedLine.code} traçada e enquadrada no mapa!</span>
          </div>
        )}

        {/* Temporary banner when street snapping completes */}
        {streetSnapBanner && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 border-2 border-white">
            <Milestone className="w-4 h-4" />
            <span>🛣️ Rota traçada 100% sobre as vias e ruas de Fortaleza!</span>
          </div>
        )}

        {/* Floating Restore Controls when Clean Map Mode is Active */}
        {isCleanMapMode && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
            <button
              onClick={() => setIsFollowingBus(!isFollowingBus)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-md transition active:scale-95"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Centralizar</span>
            </button>
            <button
              onClick={() => setIsCleanMapMode(false)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-md transition active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Restaurar Painéis</span>
            </button>
          </div>
        )}

        {/* --- OVERLAYS VISIBLE WHEN NOT IN CLEAN MAP MODE --- */}
        {!isCleanMapMode && (
          <>
            {/* HUD Top Center: Turn Guidance Card */}
            {nextManeuver && (
              <>
                {/* Desktop Turn Guidance Card */}
                <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-lg pointer-events-auto">
                  <div className="bg-slate-900/95 border-2 border-emerald-500/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/60 flex items-center justify-center flex-shrink-0">
                        {renderTurnIcon(nextManeuver.turnType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            Instrução de Rota • Conversão #{currentManeuverIndex + 1}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            a {formatDistance(distanceToNextManeuver)}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                          {nextManeuver.instruction}
                        </h4>
                        <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                          Entrar em: <strong className="text-emerald-300">{nextManeuver.streetName}</strong>
                          {nextManeuver.landmark && ` (${nextManeuver.landmark})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={handleSpeakManeuver}
                        title="Ouvir instrução de manobra"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition active:scale-95"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleAdvanceManeuver}
                        title="Avançar para a próxima rua"
                        className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition"
                      >
                        <span>Próx.</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Turn Guidance Strip: ultra-compact single row */}
                <div className="sm:hidden absolute top-2 left-2 right-2 z-20 pointer-events-auto">
                  <div className="bg-slate-900/95 border border-emerald-500/70 rounded-xl px-2.5 py-1.5 shadow-xl backdrop-blur-md flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/60 flex items-center justify-center flex-shrink-0">
                        {renderTurnIcon(nextManeuver.turnType)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight block leading-none">
                          a {formatDistance(distanceToNextManeuver)}
                        </span>
                        <p className="text-xs font-black text-white truncate leading-tight mt-0.5">
                          {nextManeuver.streetName || nextManeuver.instruction}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={handleSpeakManeuver}
                        className="p-1 rounded-lg bg-slate-800 text-emerald-400 active:scale-95"
                        title="Ouvir manobra"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleAdvanceManeuver}
                        className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] active:scale-95"
                      >
                        Próx
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* HUD Speedometer */}
            {/* Desktop Speedometer Card */}
            <div className="hidden sm:flex absolute top-16 sm:top-3 left-3 z-20 flex-col gap-2">
              <div
                className={`px-4 py-2.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 transition-colors ${
                  isOverSpeed
                    ? 'bg-rose-950/90 border-rose-600 text-rose-100 animate-pulse'
                    : 'bg-slate-950/85 border-slate-800 text-white'
                }`}
              >
                <div className="text-center">
                  <span className="text-3xl sm:text-4xl font-black tracking-tighter tabular-nums">
                    {currentSpeed}
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    km/h
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-700/60" />
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-rose-600 bg-white text-slate-950 font-black text-xs flex items-center justify-center shadow-xs"
                    title={`Limite de velocidade da via: ${selectedLine.speedLimit} km/h`}
                  >
                    {selectedLine.speedLimit}
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">
                    Limite
                  </span>
                </div>
              </div>

              {/* Punctuality Badge */}
              <div className="bg-slate-950/85 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">Horário:</span>
                <span className="font-bold text-emerald-400">No Horário</span>
              </div>
            </div>

            {/* Mobile Speedometer Pill (tiny compact badge) */}
            <div className="sm:hidden absolute top-14 left-2 z-20 pointer-events-auto">
              <div
                className={`px-2 py-1 rounded-xl border backdrop-blur-md shadow-lg flex items-center gap-1.5 ${
                  isOverSpeed
                    ? 'bg-rose-950/90 border-rose-600 text-rose-100 animate-pulse'
                    : 'bg-slate-950/85 border-slate-800 text-white'
                }`}
              >
                <span className="text-sm font-black tabular-nums">{currentSpeed}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">km/h</span>
                <span className="w-4 h-4 rounded-full border border-rose-600 bg-white text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {selectedLine.speedLimit}
                </span>
              </div>
            </div>

            {/* HUD Right Controls */}
            {/* Desktop Full Controls */}
            <div className="hidden sm:flex absolute top-16 sm:top-3 right-3 z-20 flex-col gap-2">
              {/* GPS Mode Toggle (Simulador vs GPS Real) */}
              <div className="bg-slate-950/90 border border-slate-800 backdrop-blur-md p-1 rounded-xl shadow-xl flex items-center gap-1">
                <button
                  onClick={() => {
                    setGpsMode('simulated');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    gpsMode === 'simulated'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Simulador</span>
                </button>
                <button
                  onClick={() => {
                    setGpsMode('real');
                    setIsSimulating(false);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    gpsMode === 'real'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>GPS Real</span>
                </button>
              </div>

              {/* Map theme and Recenter actions */}
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => setIsFollowingBus(!isFollowingBus)}
                  title={isFollowingBus ? 'Bloqueado no veículo' : 'Livre para arrastar'}
                  className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition ${
                    isFollowingBus
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950/85 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setMapTheme(mapTheme === 'streets' ? 'dark' : 'streets')}
                  title="Alternar Modo Noturno / Diurno"
                  className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-800 text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition"
                >
                  {mapTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setShowStopsList(!showStopsList)}
                  title="Ver todas as paradas do itinerário"
                  className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition ${
                    showStopsList
                      ? 'bg-slate-800 text-emerald-400 border-emerald-500'
                      : 'bg-slate-950/85 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>

              {/* Simulator Bar (when simulated mode is on) */}
              {gpsMode === 'simulated' && (
                <div className="bg-slate-950/95 border border-amber-500/40 backdrop-blur-md p-2 rounded-xl shadow-2xl flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between text-amber-300 font-semibold text-[11px]">
                    <span>Controle de Simulação</span>
                    <span>{simSpeedMultiplier}x Vel.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsSimulating(!isSimulating)}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                        isSimulating
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isSimulating ? 'Pausar' : 'Iniciar'}</span>
                    </button>
                    <button
                      onClick={handleResetSimulator}
                      title="Reiniciar simulador no ponto inicial"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setSimSpeedMultiplier(
                          simSpeedMultiplier === 1 ? 2 : simSpeedMultiplier === 2 ? 4 : 1
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px]"
                    >
                      {simSpeedMultiplier}x
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Compact Control Bar (vertical icon pill on right edge) */}
            <div className="sm:hidden absolute top-14 right-2 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
              <div className="bg-slate-950/90 border border-slate-800 backdrop-blur-md p-1 rounded-xl shadow-xl flex flex-col gap-1.5">
                <button
                  onClick={() => setIsFollowingBus(!isFollowingBus)}
                  title={isFollowingBus ? 'Bloqueado no veículo' : 'Livre para arrastar'}
                  className={`p-2 rounded-lg transition ${
                    isFollowingBus ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMapTheme(mapTheme === 'streets' ? 'dark' : 'streets')}
                  title="Tema do mapa"
                  className="p-2 rounded-lg text-slate-300 hover:text-white"
                >
                  {mapTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowStopsList(!showStopsList)}
                  title="Paradas"
                  className={`p-2 rounded-lg transition ${
                    showStopsList ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const nextMode = gpsMode === 'simulated' ? 'real' : 'simulated';
                    setGpsMode(nextMode);
                    if (nextMode === 'real') setIsSimulating(false);
                  }}
                  title={gpsMode === 'simulated' ? 'Modo: Simulador' : 'Modo: GPS Real'}
                  className={`p-2 rounded-lg transition ${
                    gpsMode === 'real' ? 'bg-emerald-600 text-white' : 'bg-amber-600/80 text-white'
                  }`}
                >
                  {gpsMode === 'real' ? <Navigation className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
                </button>
              </div>

              {/* Mobile Simulator floating mini badge if simulating */}
              {gpsMode === 'simulated' && (
                <div className="bg-slate-950/95 border border-amber-500/50 backdrop-blur-md p-1 rounded-xl shadow-xl flex items-center gap-1">
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`p-1.5 rounded-lg text-white font-bold ${
                      isSimulating ? 'bg-amber-600' : 'bg-emerald-600'
                    }`}
                  >
                    {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleResetSimulator}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Sidebar / Drawer: Itinerary Stops List */}
        {showStopsList && (
          <div className="absolute top-16 right-3 bottom-24 w-80 max-w-[calc(100vw-24px)] z-30 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Itinerário ({activeStops.length} Paradas)
              </h3>
              <button
                onClick={() => setShowStopsList(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md"
              >
                Fechar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-800/40">
              {activeStops.map((stop, idx) => {
                const isCurrent = idx === currentStopIndex;
                const isPast = idx < currentStopIndex;
                return (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setCurrentStopIndex(idx);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo([stop.lat, stop.lng]);
                      }
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition flex items-start gap-2.5 ${
                      isCurrent
                        ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-100'
                        : isPast
                        ? 'opacity-60 text-slate-400 hover:opacity-100'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : isPast
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {stop.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs leading-tight truncate">
                        {stop.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {stop.street || stop.landmark || 'Parada de Ônibus'}
                      </p>
                      {stop.isTerminal && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-amber-400 uppercase">
                          ★ Terminal
                        </span>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase px-1.5 py-0.5 rounded-sm bg-emerald-900/60">
                        Próxima
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL: "Consultar Itinerário da Linha" (Exactly matching User Screenshot!) */}
        {showItineraryPortalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white text-slate-900 border border-slate-300 p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-2xl font-normal text-slate-900 tracking-tight">
                  Itinerário da Linha
                </h2>
                <button
                  onClick={() => setShowItineraryPortalModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Consultation Input & Button matching the screenshot */}
              <div className="py-4 border-b border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <select
                      value={searchLineId}
                      onChange={(e) => setSearchLineId(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 bg-white focus:outline-hidden focus:border-slate-500"
                    >
                      {allLines.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.code}-{l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      onSelectLine(searchLineId);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-400 rounded-md text-sm font-medium text-slate-900 transition"
                  >
                    Consultar
                  </button>
                </div>
              </div>

              {/* Consultation Results Header */}
              <div className="pt-4 pb-2">
                <h3 className="text-xl font-normal text-slate-900">
                  Linha: {lineBeingConsulted.code}-{lineBeingConsulted.name}
                </h3>
              </div>

              {/* Two columns: IDA and VOLTA (Exactly like screenshot!) */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 pb-4">
                {/* Column 1: IDA */}
                <div className="space-y-2">
                  <div className="pb-2 border-b-2 border-slate-300">
                    <h4 className="text-sm font-bold text-slate-900">
                      IDA - Ponto inicial: {lineBeingConsulted.origin}
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100 text-sm">
                    {lineBeingConsulted.stopsIda.map((stop, i) => (
                      <div key={stop.id} className="py-2 text-slate-800 flex items-center justify-between">
                        <span>{stop.name}</span>
                        {stop.isTerminal && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                            Terminal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      onSelectLine(lineBeingConsulted.id);
                      setDirection('ida');
                      setShowItineraryPortalModal(false);
                      setTimeout(fitRouteOnMap, 150);
                    }}
                    className="w-full mt-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Route className="w-4 h-4" />
                    <span>Traçar IDA no Mapa</span>
                  </button>
                </div>

                {/* Column 2: VOLTA */}
                <div className="space-y-2">
                  <div className="pb-2 border-b-2 border-slate-300">
                    <h4 className="text-sm font-bold text-slate-900">
                      VOLTA - Ponto inicial: {lineBeingConsulted.destination}
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100 text-sm">
                    {lineBeingConsulted.stopsVolta.map((stop, i) => (
                      <div key={stop.id} className="py-2 text-slate-800 flex items-center justify-between">
                        <span>{stop.name}</span>
                        {stop.isTerminal && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                            Terminal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      onSelectLine(lineBeingConsulted.id);
                      setDirection('volta');
                      setShowItineraryPortalModal(false);
                      setTimeout(fitRouteOnMap, 150);
                    }}
                    className="w-full mt-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Route className="w-4 h-4" />
                    <span>Traçar VOLTA no Mapa</span>
                  </button>
                </div>
              </div>

              {/* Modal footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Dados oficiais de itinerário da Viação Fortaleza</span>
                <button
                  onClick={() => setShowItineraryPortalModal(false)}
                  className="px-4 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HUD Bottom: Next Stop Guidance & Driver Action Card */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 z-20 max-w-4xl mx-auto pointer-events-auto">
          {/* Mobile Collapsed Bottom Strip (Default on mobile: only ~52px height!) */}
          <div className="sm:hidden">
            {!isMobileCockpitExpanded ? (
              <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                  onClick={() => setIsMobileCockpitExpanded(true)}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/60 flex items-center justify-center text-emerald-400 font-black text-xs flex-shrink-0">
                    {nextStop ? nextStop.order : '★'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">
                        {isTripFinished ? 'Fim' : 'Próxima'}
                      </span>
                      {!isTripFinished && (
                        <span className="text-[10px] font-mono text-slate-300 font-bold">
                          {formatDistance(distanceToNextStop)} • ~{etaMinutes}m
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-black text-white truncate leading-tight">
                      {nextStop ? nextStop.name : 'Viagem Concluída!'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!isTripFinished ? (
                    <button
                      onClick={handleAdvanceStop}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition"
                    >
                      <span>Avançar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDirection(direction === 'ida' ? 'volta' : 'ida');
                        setCurrentStopIndex(0);
                        setCurrentManeuverIndex(0);
                        setSimStepIndex(0);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      Retorno
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileCockpitExpanded(true)}
                    title="Expandir painel do motorista"
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 active:scale-95"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Mobile Expanded View */
              <div className="bg-slate-900/98 border border-emerald-600/60 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 max-h-[75vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5" />
                    Painel do Motorista
                  </span>
                  <button
                    onClick={() => setIsMobileCockpitExpanded(false)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Ver Mapa</span>
                  </button>
                </div>

                {!isTripFinished && nextStop ? (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/60 flex items-center justify-center text-emerald-400 font-black text-base flex-shrink-0">
                        {nextStop.order}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-emerald-400">
                          Próxima Parada
                        </span>
                        <h3 className="text-sm font-bold text-white leading-tight truncate">
                          {nextStop.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {nextStop.street || nextStop.landmark || 'Ponto de ônibus'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={handleAnnounceStop}
                        className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 active:scale-95"
                        title="Voz"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleAdvanceStop}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 active:scale-95"
                      >
                        <span>Avançar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-emerald-400 font-bold text-xs">
                    Viagem Concluída!
                  </div>
                )}

                {/* Progress bar */}
                <div className="w-full">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Progresso</span>
                    <span className="font-bold text-slate-300">
                      {Math.min(currentStopIndex, activeStops.length)} de {activeStops.length} paradas
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${(Math.min(currentStopIndex, activeStops.length) / activeStops.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Passenger Tally & Incident */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px]">Passageiros:</span>
                    <span className="font-bold text-white tabular-nums px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs">
                      {passengerCount}
                    </span>
                    <button
                      onClick={() => setPassengerCount((p) => p + 1)}
                      className="w-5 h-5 rounded bg-slate-800 text-white font-bold text-xs"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setPassengerCount((p) => Math.max(0, p - 1))}
                      className="w-5 h-5 rounded bg-slate-800 text-slate-400 text-xs"
                    >
                      -
                    </button>
                  </div>
                  <button
                    onClick={() => setShowIncidentModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-700/60 text-rose-300 text-[11px] font-semibold"
                  >
                    Alerta CCO
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Cockpit (Always full comfortable view on larger screens) */}
          <div className="hidden sm:flex bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex-col gap-3">
            {/* Next Stop Main Card */}
            {!isTripFinished && nextStop ? (
              <div className="flex flex-row items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-black text-lg flex-shrink-0">
                    {nextStop.order}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Próxima Parada
                      </span>
                      {nextStop.isTerminal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ★ Terminal Integração
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                      {nextStop.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {nextStop.street || nextStop.landmark || 'Parada de Ônibus'}
                    </p>
                  </div>
                </div>

                {/* Distance & ETA + Quick Announcement button */}
                <div className="flex items-center gap-2">
                  <div className="text-right px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-base font-black text-emerald-400 tabular-nums">
                      {formatDistance(distanceToNextStop)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      ETA: ~{etaMinutes} min
                    </span>
                  </div>

                  {/* Audio announcement button */}
                  <button
                    onClick={handleAnnounceStop}
                    title="Anunciar parada por áudio / voz"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 active:scale-95 transition"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  {/* Advance to next stop manually */}
                  <button
                    onClick={handleAdvanceStop}
                    className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <span>Cheguei / Avançar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle className="w-6 h-6" />
                  <span>Viagem Concluída! Chegada ao Ponto Final.</span>
                </div>
                <button
                  onClick={() => {
                    setDirection(direction === 'ida' ? 'volta' : 'ida');
                    setCurrentStopIndex(0);
                    setCurrentManeuverIndex(0);
                    setSimStepIndex(0);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Iniciar Viagem de Retorno ({direction === 'ida' ? 'Volta' : 'Ida'})
                </button>
              </div>
            )}

            {/* Progress Bar through the stops */}
            <div className="w-full">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Progresso do Percurso</span>
                <span className="font-semibold text-slate-300">
                  {Math.min(currentStopIndex, activeStops.length)} de {activeStops.length} paradas
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(Math.min(currentStopIndex, activeStops.length) / activeStops.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Quick Driver Tools: Passenger Tally & Incident Report */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
              {/* Passenger Tally */}
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">Passageiros a bordo:</span>
                <span className="font-bold text-white tabular-nums px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                  {passengerCount}
                </span>
                <button
                  onClick={() => setPassengerCount((p) => p + 1)}
                  className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  +1
                </button>
                <button
                  onClick={() => setPassengerCount((p) => p + 5)}
                  className="px-1.5 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px]"
                >
                  +5
                </button>
                <button
                  onClick={() => setPassengerCount((p) => Math.max(0, p - 1))}
                  className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs"
                >
                  -1
                </button>
              </div>

              {/* Alert CCO button */}
              <button
                onClick={() => setShowIncidentModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-semibold transition active:scale-95"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Alerta CCO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Registrar Ocorrência / CCO
              </h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Cancelar
              </button>
            </div>

            {incidentSuccess ? (
              <div className="py-8 text-center text-emerald-400 space-y-2">
                <CheckCircle className="w-12 h-12 mx-auto" />
                <p className="font-bold text-base">Alerta enviado ao CCO com sucesso!</p>
                <p className="text-xs text-slate-400">Coordenadas e dados da linha transmitidos.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitIncident} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Ocorrência
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as IncidentReport['type'])}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="transito_intenso">Trânsito Intenso / Engarrafamento</option>
                    <option value="acidente">Acidente na Via</option>
                    <option value="pane_mecanica">Pane Mecânica / Elétrica</option>
                    <option value="desvio_itinerario">Desvio Emergencial de Itinerário</option>
                    <option value="apoio_seguranca">Solicitação de Apoio de Segurança</option>
                    <option value="outro">Outro Motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Detalhes / Ponto de Referência
                  </label>
                  <textarea
                    rows={3}
                    value={incidentDesc}
                    onChange={(e) => setIncidentDesc(e.target.value)}
                    placeholder="Ex: Trecho com semáforo quebrado na Av. Gomes Brasil, retenção de 20 min..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-hidden focus:border-rose-500 placeholder:text-slate-600"
                  />
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span>Linha: <strong>{selectedLine.code}</strong></span>
                  <span>Carro: <strong>{selectedLine.activePrefix || '02501'}</strong></span>
                  <span>Motorista: <strong>{settings.driverName}</strong></span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmitir Alerta ao CCO</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Line Modal */}
      {showEditLineModal && (
        <EditLineModal
          line={selectedLine}
          isOpen={showEditLineModal}
          onClose={() => setShowEditLineModal(false)}
          onSaved={() => {
            fitRouteOnMap();
          }}
        />
      )}

      {/* Mobile Route Actions Modal */}
      {showMobileRouteMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md"
                  style={{ backgroundColor: selectedLine.color }}
                >
                  {selectedLine.code}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Opções & Ferramentas</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {selectedLine.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileRouteMenu(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Switch Line */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Trocar Linha Selecionada:
              </label>
              <select
                value={selectedLine.id}
                onChange={(e) => {
                  onSelectLine(e.target.value);
                  setShowMobileRouteMenu(false);
                }}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500"
              >
                {allLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.code} - {line.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons List */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => {
                  setShowMobileRouteMenu(false);
                  fitRouteOnMap();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-between shadow-md active:scale-95 transition"
              >
                <span className="flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  <span>Traçar e Enquadrar no Mapa</span>
                </span>
                <span className="text-[10px] bg-sky-700/60 px-2 py-0.5 rounded">Ver rota</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileRouteMenu(false);
                  setShowGpsRecorderWidget(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-between shadow-md active:scale-95 transition"
              >
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  <span>Copiar Trajeto via GPS</span>
                </span>
                <span className="text-[10px] bg-purple-700/60 px-2 py-0.5 rounded">
                  {isGpsRecording ? '🔴 Gravando' : 'Gravar GPS'}
                </span>
              </button>

              <button
                onClick={() => {
                  setShowMobileRouteMenu(false);
                  setShowEditLineModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between border border-slate-700 active:scale-95 transition"
              >
                <span className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-400" />
                  <span>Editar Dados & Ruas da Linha</span>
                </span>
                <span className="text-[10px] text-slate-400">Modificar</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileRouteMenu(false);
                  handleSnapToStreets();
                }}
                disabled={isSnappingStreets}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-between shadow-md active:scale-95 transition"
              >
                <span className="flex items-center gap-2">
                  <Milestone className="w-4 h-4" />
                  <span>Calibrar 100% nas Ruas (OSRM)</span>
                </span>
                <span className="text-[10px] bg-amber-700/60 px-2 py-0.5 rounded">
                  {isSnappingStreets ? 'Calibrando...' : 'Ajustar'}
                </span>
              </button>

              <button
                onClick={() => {
                  setShowMobileRouteMenu(false);
                  setShowItineraryPortalModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-md active:scale-95 transition"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>Consultar Itinerário Oficial</span>
                </span>
                <span className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded">Tabela</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileRouteMenu(false);
                  setIsCleanMapMode(!isCleanMapMode);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center justify-between border border-emerald-700/40 active:scale-95 transition"
              >
                <span className="flex items-center gap-2">
                  {isCleanMapMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{isCleanMapMode ? 'Restaurar Painéis' : 'Modo Foco no Mapa (Limpo)'}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {isCleanMapMode ? 'Ativo' : 'Tela cheia'}
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowMobileRouteMenu(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs mt-1 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

