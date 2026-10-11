export interface BusStop {
  id: string;
  name: string;
  code?: string;
  lat: number;
  lng: number;
  order: number;
  isTerminal?: boolean;
  landmark?: string; // e.g. "Próximo ao Shopping Iguatemi"
  street?: string; // e.g. "Av. Washington Soares"
  estimatedWaitMinutes?: number;
}

export interface TurnManeuver {
  id: string;
  instruction: string; // e.g. "Vire à direita na Rua Leão do Norte"
  streetName: string; // e.g. "Rua Leão do Norte"
  turnType: 'straight' | 'turn-left' | 'turn-right' | 'roundabout' | 'merge' | 'u-turn' | 'terminal';
  lat: number;
  lng: number;
  distanceFromStartMeters?: number;
  landmark?: string;
}

export interface DepartureTime {
  id: string;
  time: string; // "06:15", "06:30", etc.
  driverName?: string;
  vehiclePrefix?: string;
  direction: 'ida' | 'volta';
  status: 'previsto' | 'em_andamento' | 'concluido' | 'cancelado';
}

export interface BusLine {
  id: string;
  code: string; // e.g. "004", "019", "027"
  name: string; // e.g. "Messejana / Papicu / Cambeba"
  origin: string; // e.g. "Terminal Messejana"
  destination: string; // e.g. "Terminal Papicu"
  category: 'Troncal' | 'Radial' | 'Circular' | 'Alimentadora' | 'Inter-terminais';
  color: string; // Hex color
  speedLimit: number; // km/h, default 50
  frequencyMinutes: number; // e.g. 12 min
  operatingDays: string; // e.g. "Dias úteis" or "Dias úteis, sábados e domingos" (como no viacaofortaleza.com.br/rotas)
  stopsIda: BusStop[];
  stopsVolta: BusStop[];
  streetListIda: string[]; // Ruas reais percorridas no itinerário de ida
  streetListVolta: string[]; // Ruas reais percorridas no itinerário de volta
  maneuversIda: TurnManeuver[]; // Instruções curva a curva para o motorista saber onde entrar
  maneuversVolta: TurnManeuver[];
  routePathIda: [number, number][]; // coordinates [lat, lng]
  routePathVolta: [number, number][];
  departures: DepartureTime[];
  activePrefix?: string;
}

export interface BusVehicle {
  id: string;
  prefix: string; // e.g. "02412"
  plate: string; // e.g. "PNX-8921"
  model: string; // e.g. "Caio Apache VIP V - MB OF-1721"
  hasAirConditioning: boolean;
  hasAccessibilityLift: boolean;
  status: 'operando' | 'reserva' | 'manutencao';
  currentLineId?: string;
}

export interface IncidentReport {
  id: string;
  timestamp: string;
  lineCode: string;
  vehiclePrefix: string;
  driverName: string;
  type: 'transito_intenso' | 'acidente' | 'pane_mecanica' | 'desvio_itinerario' | 'apoio_seguranca' | 'outro';
  description: string;
  location?: { lat: number; lng: number };
  status: 'pendente' | 'em_atendimento' | 'resolvido';
}

export interface ActiveTrip {
  lineId: string;
  direction: 'ida' | 'volta';
  vehiclePrefix: string;
  driverName: string;
  startTime: string;
  currentStopIndex: number;
  currentManeuverIndex: number;
  passengerCount: number;
  totalStopsVisited: number;
  punctualityStatus: 'no_horario' | 'adiantado' | 'atrasado';
  delayMinutes: number;
}

export interface RecordedGpsTrack {
  id: string;
  name: string;
  timestamp: string; // ISO string
  lineCode?: string;
  direction?: 'ida' | 'volta';
  points: [number, number][]; // [lat, lng]
  markedStops?: {
    id: string;
    lat: number;
    lng: number;
    name: string;
    order: number;
  }[];
  totalDistanceKm: number;
  durationSeconds: number;
  driverName?: string;
}

