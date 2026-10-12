import { BusLine } from "../types/bus";

// Helper function to generate interpolated coordinate path between waypoints
function generatePath(waypoints: [number, number][], pointsBetween = 6): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    for (let step = 0; step <= pointsBetween; step++) {
      const t = step / pointsBetween;
      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      result.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    }
  }
  return result;
}

// ==========================================
// WAYPOINTS BASEADOS NO MOOVIT / ETUFOR FORTALEZA
// ==========================================

// 028: Antônio Bezerra / Papicu (Santos Dumont)
const WAYPOINTS_028_IDA: [number, number][] = [
  [-3.7371, -38.5878], // Terminal Antônio Bezerra
  [-3.7378, -38.5750], // Av. Mister Hull / Bezerra de Menezes
  [-3.7360, -38.5580], // Av. Bezerra de Menezes (North Shopping)
  [-3.7320, -38.5360], // Av. Imperador / Centro
  [-3.7345, -38.5200], // Av. Santos Dumont (Aldeota Oeste)
  [-3.7365, -38.5020], // Av. Santos Dumont (Praça Portugal)
  [-3.7380, -38.4890], // Av. Santos Dumont / Cel. Jucá
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_028_VOLTA: [number, number][] = [...WAYPOINTS_028_IDA].reverse();

// 026: Antônio Bezerra / Messejana (Perimetral)
const WAYPOINTS_026_IDA: [number, number][] = [
  [-3.7371, -38.5878], // Terminal Antônio Bezerra
  [-3.7550, -38.5950], // Perimetral / Pici
  [-3.7820, -38.5920], // Perimetral / Siqueira
  [-3.7950, -38.5780], // Perimetral / José Walter
  [-3.8080, -38.5500], // Perimetral / Passaré
  [-3.8200, -38.5200], // Perimetral / Jangurussu
  [-3.8340, -38.4970], // Terminal Messejana
];
const WAYPOINTS_026_VOLTA: [number, number][] = [...WAYPOINTS_026_IDA].reverse();

// 072: Antônio Bezerra / Parangaba
const WAYPOINTS_072_IDA: [number, number][] = [
  [-3.7371, -38.5878], // Terminal Antônio Bezerra
  [-3.7440, -38.5750], // Demétrio Menezes
  [-3.7500, -38.5680], // Jovita Feitosa
  [-3.7580, -38.5620], // Av. José Bastos
  [-3.7680, -38.5600], // Av. Silas Munguba
  [-3.7745, -38.5630], // Terminal Parangaba
];
const WAYPOINTS_072_VOLTA: [number, number][] = [...WAYPOINTS_072_IDA].reverse();

// 076: Conjunto Ceará / Aldeota / Papicu
const WAYPOINTS_076_IDA: [number, number][] = [
  [-3.7711, -38.6045], // Terminal Conjunto Ceará
  [-3.7700, -38.5920], // Av. Central
  [-3.7650, -38.5750], // Av. José Bastos
  [-3.7550, -38.5450], // Av. 13 de Maio
  [-3.7500, -38.5200], // Av. Pontes Vieira
  [-3.7420, -38.4980], // Av. Desembargador Moreira
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_076_VOLTA: [number, number][] = [...WAYPOINTS_076_IDA].reverse();

// 030: Siqueira / Papicu / 13 de Maio
const WAYPOINTS_030_IDA: [number, number][] = [
  [-3.7938, -38.5985], // Terminal Siqueira
  [-3.7800, -38.5850], // Av. General Osório de Paiva
  [-3.7650, -38.5650], // Av. João Pessoa
  [-3.7520, -38.5400], // Av. 13 de Maio
  [-3.7480, -38.5150], // Av. Pontes Vieira
  [-3.7420, -38.4920], // Av. Des. Moreira
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_030_VOLTA: [number, number][] = [...WAYPOINTS_030_IDA].reverse();

// 041: Parangaba / Oliveira Paiva / Papicu
const WAYPOINTS_041_IDA: [number, number][] = [
  [-3.7745, -38.5630], // Terminal Parangaba
  [-3.7820, -38.5520], // Silas Munguba
  [-3.7950, -38.5320], // Arena Castelão
  [-3.8050, -38.5180], // Oliveira Paiva
  [-3.7900, -38.4950], // Washington Soares
  [-3.7540, -38.4870], // Santana Júnior
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_041_VOLTA: [number, number][] = [...WAYPOINTS_041_IDA].reverse();

// 050: Siqueira / Papicu / Washington Soares
const WAYPOINTS_050_IDA: [number, number][] = [
  [-3.7938, -38.5985], // Terminal Siqueira
  [-3.8050, -38.5700], // Perimetral
  [-3.8150, -38.5350], // Arena Castelão
  [-3.8050, -38.5100], // Oliveira Paiva
  [-3.7850, -38.4850], // Unifor
  [-3.7550, -38.4850], // Santana Júnior
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_050_VOLTA: [number, number][] = [...WAYPOINTS_050_IDA].reverse();

// 087: Expresso / Siqueira / Papicu
const WAYPOINTS_087_IDA: [number, number][] = [
  [-3.7938, -38.5985], // Terminal Siqueira
  [-3.7800, -38.5700], // Via Expressa Sul
  [-3.7650, -38.5300], // Av. Raul Barbosa
  [-3.7500, -38.4950], // Santana Júnior
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_087_VOLTA: [number, number][] = [...WAYPOINTS_087_IDA].reverse();

// 089: Expresso / Parangaba / Papicu
const WAYPOINTS_089_IDA: [number, number][] = [
  [-3.7745, -38.5630], // Terminal Parangaba
  [-3.7680, -38.5350], // Raul Barbosa
  [-3.7500, -38.4950], // Santana Júnior
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_089_VOLTA: [number, number][] = [...WAYPOINTS_089_IDA].reverse();

// ==========================================
// NOVAS LINHAS EXTRAÍDAS DO MOOVIT FORTALEZA
// ==========================================

// 024: Antônio Bezerra / Lagoa / Unifor (Moovit ETUFOR)
const WAYPOINTS_024_IDA: [number, number][] = [
  [-3.7371, -38.5878], // Terminal Antônio Bezerra
  [-3.7450, -38.5730], // Jovita Feitosa
  [-3.7560, -38.5600], // José Bastos
  [-3.7663, -38.5524], // Terminal Lagoa
  [-3.7600, -38.5350], // Eduardo Girão / Vila União
  [-3.7680, -38.5050], // Av. Murilo Borges
  [-3.7850, -38.4830], // Av. Washington Soares / Unifor
];
const WAYPOINTS_024_VOLTA: [number, number][] = [...WAYPOINTS_024_IDA].reverse();

// 042: Antônio Bezerra / Francisco Sá / Papicu (Moovit ETUFOR)
const WAYPOINTS_042_IDA: [number, number][] = [
  [-3.7371, -38.5878], // Terminal Antônio Bezerra
  [-3.7220, -38.5700], // Av. Tenente Lisboa
  [-3.7190, -38.5550], // Av. Francisco Sá (Álvaro Weyne)
  [-3.7180, -38.5350], // Av. Francisco Sá (Carlito Pamplona)
  [-3.7210, -38.5200], // Centro / Mercado Central
  [-3.7260, -38.5020], // Av. Dom Luís / Aldeota
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_042_VOLTA: [number, number][] = [...WAYPOINTS_042_IDA].reverse();

// 051: Grande Circular I (Moovit ETUFOR - Papicu -> Messejana -> Parangaba -> Bezerra -> Papicu)
const WAYPOINTS_051_ROTA: [number, number][] = [
  [-3.7397, -38.4808], // Terminal Papicu
  [-3.7600, -38.4880], // Av. Eng. Santana Júnior
  [-3.7850, -38.4830], // Av. Washington Soares / Unifor
  [-3.8340, -38.4970], // Terminal Messejana
  [-3.8180, -38.5300], // Av. Perimetral / Passaré
  [-3.7745, -38.5630], // Terminal Parangaba
  [-3.7500, -38.5700], // Jovita Feitosa
  [-3.7371, -38.5878], // Terminal Antônio Bezerra
  [-3.7360, -38.5500], // Av. Bezerra de Menezes
  [-3.7345, -38.5100], // Av. Santos Dumont
  [-3.7397, -38.4808], // Terminal Papicu
];

// 052: Grande Circular II (Moovit ETUFOR - Papicu -> Bezerra -> Parangaba -> Messejana -> Papicu)
const WAYPOINTS_052_ROTA: [number, number][] = [...WAYPOINTS_051_ROTA].reverse();

// 066: Parangaba / Aeroporto / Papicu (Moovit ETUFOR)
const WAYPOINTS_066_IDA: [number, number][] = [
  [-3.7745, -38.5630], // Terminal Parangaba
  [-3.7760, -38.5320], // Aeroporto Internacional Pinto Martins
  [-3.7550, -38.5220], // Av. Borges de Melo
  [-3.7480, -38.4980], // Av. Raul Barbosa
  [-3.7397, -38.4808], // Terminal Papicu
];
const WAYPOINTS_066_VOLTA: [number, number][] = [...WAYPOINTS_066_IDA].reverse();

// 073: Siqueira / Praia de Iracema (Moovit ETUFOR)
const WAYPOINTS_073_IDA: [number, number][] = [
  [-3.7938, -38.5985], // Terminal Siqueira
  [-3.7750, -38.5800], // Av. Gen. Osório de Paiva
  [-3.7520, -38.5450], // Benfica / Carapinima
  [-3.7300, -38.5300], // Centro / Tristão Gonçalves
  [-3.7210, -38.5150], // Praia de Iracema / Centro Dragão do Mar
];
const WAYPOINTS_073_VOLTA: [number, number][] = [...WAYPOINTS_073_IDA].reverse();

// 074: Antônio Bezerra / Unifor (Moovit ETUFOR)
const WAYPOINTS_074_IDA: [number, number][] = [
  [-3.7371, -38.5878], // Terminal Antônio Bezerra
  [-3.7480, -38.5680], // Jovita Feitosa
  [-3.7520, -38.5400], // Av. 13 de Maio
  [-3.7500, -38.5150], // Av. Pontes Vieira
  [-3.7850, -38.4830], // Av. Washington Soares / Unifor
];
const WAYPOINTS_074_VOLTA: [number, number][] = [...WAYPOINTS_074_IDA].reverse();

// 077: Parangaba / Mucuripe (Moovit ETUFOR)
const WAYPOINTS_077_IDA: [number, number][] = [
  [-3.7745, -38.5630], // Terminal Parangaba
  [-3.7650, -38.5350], // Av. Raul Barbosa
  [-3.7420, -38.4980], // Av. Dom Luís
  [-3.7190, -38.4750], // Mucuripe / Beira Mar
];
const WAYPOINTS_077_VOLTA: [number, number][] = [...WAYPOINTS_077_IDA].reverse();

// 078: Siqueira / Mucuripe (Moovit ETUFOR)
const WAYPOINTS_078_IDA: [number, number][] = [
  [-3.7938, -38.5985], // Terminal Siqueira
  [-3.7663, -38.5524], // Terminal Lagoa / Montese
  [-3.7500, -38.5180], // Av. Pontes Vieira
  [-3.7220, -38.4800], // Mucuripe / Beira Mar
];
const WAYPOINTS_078_VOLTA: [number, number][] = [...WAYPOINTS_078_IDA].reverse();

// 082: Antônio Bezerra / Perimetral / Messejana (Moovit ETUFOR)
const WAYPOINTS_082_IDA: [number, number][] = [
  [-3.8340, -38.4970], // Terminal Messejana
  [-3.8180, -38.5350], // Perimetral / Jangurussu
  [-3.8050, -38.5600], // Perimetral / Passaré
  [-3.7850, -38.5850], // Perimetral / Siqueira
  [-3.7550, -38.5950], // Pici
  [-3.7371, -38.5878], // Terminal Antônio Bezerra
];
const WAYPOINTS_082_VOLTA: [number, number][] = [...WAYPOINTS_082_IDA].reverse();

// 084: Siqueira / Perimetral / Messejana (Moovit ETUFOR)
const WAYPOINTS_084_IDA: [number, number][] = [
  [-3.7938, -38.5985], // Terminal Siqueira
  [-3.8020, -38.5750], // Perimetral / José Walter
  [-3.8100, -38.5450], // Perimetral / Passaré
  [-3.8340, -38.4970], // Terminal Messejana
];
const WAYPOINTS_084_VOLTA: [number, number][] = [...WAYPOINTS_084_IDA].reverse();

// 086: Duque de Caxias / Messejana (Moovit ETUFOR)
const WAYPOINTS_086_IDA: [number, number][] = [
  [-3.8340, -38.4970], // Terminal Messejana
  [-3.8050, -38.5050], // Rodovia BR-116
  [-3.7650, -38.5250], // Av. Aguanambi
  [-3.7420, -38.5300], // Av. Domingos Olímpio
  [-3.7310, -38.5330], // Praça Coração de Jesus (Centro)
];
const WAYPOINTS_086_VOLTA: [number, number][] = [...WAYPOINTS_086_IDA].reverse();

export const ADDITIONAL_FORTALEZA_LINES: BusLine[] = [
  // 1. 028 Antônio Bezerra / Papicu
  {
    id: 'line-028',
    code: '028',
    name: 'Antônio Bezerra / Papicu',
    origin: 'Terminal Antônio Bezerra',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#0284c7',
    speedLimit: 50,
    frequencyMinutes: 10,
    operatingDays: 'Dias úteis e sábados',
    activePrefix: '02503',
    streetListIda: [
      'Terminal Antônio Bezerra (Plataforma A)',
      'Av. Mister Hull',
      'Av. Bezerra de Menezes (Corredor BRT)',
      'Av. Duque de Caxias',
      'Av. Santos Dumont (Pista Expressa)',
      'Praça Portugal (Aldeota)',
      'Av. Engenheiro Santana Júnior',
      'Terminal Papicu',
    ],
    streetListVolta: [
      'Terminal Papicu (Plataforma B)',
      'Av. Engenheiro Santana Júnior',
      'Av. Santos Dumont',
      'Av. Dom Manuel',
      'Av. Bezerra de Menezes (Corredor BRT)',
      'Terminal Antônio Bezerra',
    ],
    maneuversIda: [
      { id: 'm-028-1', instruction: 'Saia do Terminal Antônio Bezerra para a Av. Mister Hull', streetName: 'Av. Mister Hull', turnType: 'straight', lat: -3.7371, lng: -38.5878, landmark: 'Terminal Antônio Bezerra' },
      { id: 'm-028-2', instruction: 'Siga na canaleta exclusiva BRT Bezerra de Menezes', streetName: 'Av. Bezerra de Menezes', turnType: 'straight', lat: -3.7360, lng: -38.5580, landmark: 'North Shopping Fortaleza' },
      { id: 'm-028-3', instruction: 'Acesse a Av. Santos Dumont na Aldeota', streetName: 'Av. Santos Dumont', turnType: 'turn-right', lat: -3.7345, lng: -38.5200 },
      { id: 'm-028-4', instruction: 'Entrada na plataforma do Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808, landmark: 'Terminal Papicu' },
    ],
    maneuversVolta: [
      { id: 'm-028-v1', instruction: 'Saia do Terminal Papicu pela Santos Dumont', streetName: 'Av. Santos Dumont', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-028-v2', instruction: 'Chegada ao Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878 },
    ],
    stopsIda: [
      { id: 'stop-028-i1', name: 'Terminal Antônio Bezerra (Plataforma A)', code: 'TANT-01', lat: -3.7371, lng: -38.5878, order: 1, isTerminal: true },
      { id: 'stop-028-i2', name: 'Estação North Shopping Bezerra', code: 'NSH-02', lat: -3.7365, lng: -38.5660, order: 2, landmark: 'North Shopping' },
      { id: 'stop-028-i3', name: 'Estação Otávio Bonfim', code: 'OB-03', lat: -3.7355, lng: -38.5480, order: 3 },
      { id: 'stop-028-i4', name: 'Santos Dumont / Praça Portugal', code: 'SD-04', lat: -3.7350, lng: -38.5020, order: 4 },
      { id: 'stop-028-i5', name: 'Terminal Papicu (Plataforma B)', code: 'TPAP-05', lat: -3.7397, lng: -38.4808, order: 5, isTerminal: true },
    ],
    stopsVolta: [
      { id: 'stop-028-v1', name: 'Terminal Papicu (Plataforma B)', code: 'TPAP-05', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 'stop-028-v2', name: 'Terminal Antônio Bezerra', code: 'TANT-01V', lat: -3.7371, lng: -38.5878, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_028_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_028_VOLTA, 10),
    departures: [{ id: 'dep-028-1', time: '06:00', driverName: 'Carlos Alberto', vehiclePrefix: '02503', direction: 'ida', status: 'previsto' }],
  },

  // 2. 026 Antônio Bezerra / Messejana
  {
    id: 'line-026',
    code: '026',
    name: 'Antônio Bezerra / Messejana',
    origin: 'Terminal Antônio Bezerra',
    destination: 'Terminal Messejana',
    category: 'Troncal',
    color: '#16a34a',
    speedLimit: 60,
    frequencyMinutes: 12,
    operatingDays: 'Todos os dias',
    activePrefix: '02504',
    streetListIda: ['Terminal Antônio Bezerra', 'Av. Mister Hull', 'Av. Perimetral (Av. Pres. Costa e Silva)', 'Acesso Siqueira', 'Terminal Messejana'],
    streetListVolta: ['Terminal Messejana', 'Av. Perimetral (Av. Pres. Costa e Silva)', 'Terminal Antônio Bezerra'],
    maneuversIda: [
      { id: 'm-026-1', instruction: 'Saia do Terminal Antônio Bezerra pela Perimetral', streetName: 'Av. Pres. Costa e Silva', turnType: 'straight', lat: -3.7371, lng: -38.5878 },
      { id: 'm-026-2', instruction: 'Chegada ao Terminal Messejana', streetName: 'Terminal Messejana', turnType: 'terminal', lat: -3.8340, lng: -38.4970 },
    ],
    maneuversVolta: [
      { id: 'm-026-v1', instruction: 'Saia do Terminal Messejana em direção a Antônio Bezerra', streetName: 'Av. Pres. Costa e Silva', turnType: 'straight', lat: -3.8340, lng: -38.4970 },
      { id: 'm-026-v2', instruction: 'Chegada ao Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878 },
    ],
    stopsIda: [
      { id: 's-026-1', name: 'Terminal Antônio Bezerra', code: 'TANT-026', lat: -3.7371, lng: -38.5878, order: 1, isTerminal: true },
      { id: 's-026-2', name: 'Perimetral / Pici', code: 'PICI-02', lat: -3.7550, lng: -38.5950, order: 2 },
      { id: 's-026-3', name: 'Perimetral / Siqueira', code: 'SIQ-03', lat: -3.7820, lng: -38.5920, order: 3 },
      { id: 's-026-4', name: 'Terminal Messejana', code: 'TMES-026', lat: -3.8340, lng: -38.4970, order: 4, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-026-v1', name: 'Terminal Messejana', code: 'TMES-026', lat: -3.8340, lng: -38.4970, order: 1, isTerminal: true },
      { id: 's-026-v2', name: 'Terminal Antônio Bezerra', code: 'TANT-026', lat: -3.7371, lng: -38.5878, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_026_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_026_VOLTA, 10),
    departures: [{ id: 'dep-026-1', time: '06:10', driverName: 'Raimundo Nonato', vehiclePrefix: '02504', direction: 'ida', status: 'previsto' }],
  },

  // 3. 072 Antônio Bezerra / Parangaba
  {
    id: 'line-072',
    code: '072',
    name: 'Antônio Bezerra / Parangaba',
    origin: 'Terminal Antônio Bezerra',
    destination: 'Terminal Parangaba',
    category: 'Troncal',
    color: '#d97706',
    speedLimit: 50,
    frequencyMinutes: 12,
    operatingDays: 'Dias úteis e sábados',
    activePrefix: '02505',
    streetListIda: ['Terminal Antônio Bezerra', 'Rua Demétrio Menezes', 'Av. Jovita Feitosa', 'Av. José Bastos', 'Av. Dr. Silas Munguba', 'Terminal Parangaba'],
    streetListVolta: ['Terminal Parangaba', 'Av. Dr. Silas Munguba', 'Av. Jovita Feitosa', 'Terminal Antônio Bezerra'],
    maneuversIda: [
      { id: 'm-072-1', instruction: 'Saia do Terminal Antônio Bezerra e acesse a Jovita Feitosa', streetName: 'Av. Jovita Feitosa', turnType: 'straight', lat: -3.7371, lng: -38.5878 },
      { id: 'm-072-2', instruction: 'Acesse a Av. Silas Munguba até o Terminal Parangaba', streetName: 'Av. Silas Munguba', turnType: 'terminal', lat: -3.7745, lng: -38.5630 },
    ],
    maneuversVolta: [
      { id: 'm-072-v1', instruction: 'Saia do Terminal Parangaba pela Silas Munguba', streetName: 'Av. Silas Munguba', turnType: 'straight', lat: -3.7745, lng: -38.5630 },
      { id: 'm-072-v2', instruction: 'Entrada no Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878 },
    ],
    stopsIda: [
      { id: 's-072-1', name: 'Terminal Antônio Bezerra', code: 'TANT-072', lat: -3.7371, lng: -38.5878, order: 1, isTerminal: true },
      { id: 's-072-2', name: 'Jovita Feitosa / UFC Pici', code: 'JVF-02', lat: -3.7500, lng: -38.5680, order: 2 },
      { id: 's-072-3', name: 'Terminal Parangaba', code: 'TPAR-072', lat: -3.7745, lng: -38.5630, order: 3, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-072-v1', name: 'Terminal Parangaba', code: 'TPAR-072', lat: -3.7745, lng: -38.5630, order: 1, isTerminal: true },
      { id: 's-072-v2', name: 'Terminal Antônio Bezerra', code: 'TANT-072', lat: -3.7371, lng: -38.5878, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_072_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_072_VOLTA, 10),
    departures: [{ id: 'dep-072-1', time: '06:20', driverName: 'José Wellington', vehiclePrefix: '02505', direction: 'ida', status: 'previsto' }],
  },

  // 4. 076 Conjunto Ceará / Aldeota / Papicu
  {
    id: 'line-076',
    code: '076',
    name: 'Conjunto Ceará / Aldeota / Papicu',
    origin: 'Terminal Conjunto Ceará',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#9333ea',
    speedLimit: 50,
    frequencyMinutes: 11,
    operatingDays: 'Todos os dias',
    activePrefix: '02506',
    streetListIda: ['Terminal Conjunto Ceará', 'Av. Central', 'Av. José Bastos', 'Av. 13 de Maio', 'Av. Pontes Vieira', 'Av. Desembargador Moreira', 'Terminal Papicu'],
    streetListVolta: ['Terminal Papicu', 'Av. Santos Dumont', 'Av. 13 de Maio', 'Terminal Conjunto Ceará'],
    maneuversIda: [
      { id: 'm-076-1', instruction: 'Saia do Terminal Conjunto Ceará pela Av. Central', streetName: 'Av. Central', turnType: 'straight', lat: -3.7711, lng: -38.6045 },
      { id: 'm-076-2', instruction: 'Entre na Av. Desembargador Moreira na Aldeota', streetName: 'Av. Desembargador Moreira', turnType: 'turn-left', lat: -3.7420, lng: -38.4980 },
      { id: 'm-076-3', instruction: 'Entrada no Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-076-v1', instruction: 'Saia do Papicu pela Santos Dumont', streetName: 'Av. Santos Dumont', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-076-v2', instruction: 'Chegada ao Terminal Conjunto Ceará', streetName: 'Terminal Conjunto Ceará', turnType: 'terminal', lat: -3.7711, lng: -38.6045 },
    ],
    stopsIda: [
      { id: 's-076-1', name: 'Terminal Conjunto Ceará', code: 'TCC-01', lat: -3.7711, lng: -38.6045, order: 1, isTerminal: true },
      { id: 's-076-2', name: 'Av. 13 de Maio / Igreja de Fátima', code: 'FAT-02', lat: -3.7550, lng: -38.5450, order: 2 },
      { id: 's-076-3', name: 'Terminal Papicu', code: 'TPAP-076', lat: -3.7397, lng: -38.4808, order: 3, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-076-v1', name: 'Terminal Papicu', code: 'TPAP-076', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-076-v2', name: 'Terminal Conjunto Ceará', code: 'TCC-01', lat: -3.7711, lng: -38.6045, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_076_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_076_VOLTA, 10),
    departures: [{ id: 'dep-076-1', time: '06:15', driverName: 'Manoel Pereira', vehiclePrefix: '02506', direction: 'ida', status: 'previsto' }],
  },

  // 5. 030 Siqueira / Papicu / 13 de Maio
  {
    id: 'line-030',
    code: '030',
    name: 'Siqueira / Papicu / 13 de Maio',
    origin: 'Terminal Siqueira',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#059669',
    speedLimit: 50,
    frequencyMinutes: 10,
    operatingDays: 'Todos os dias',
    activePrefix: '02507',
    streetListIda: ['Terminal Siqueira', 'Av. Gen. Osório de Paiva', 'Av. João Pessoa', 'Av. 13 de Maio', 'Av. Pontes Vieira', 'Terminal Papicu'],
    streetListVolta: ['Terminal Papicu', 'Av. Pontes Vieira', 'Av. 13 de Maio', 'Terminal Siqueira'],
    maneuversIda: [
      { id: 'm-030-1', instruction: 'Saia do Terminal Siqueira pela Av. Osório de Paiva', streetName: 'Av. Gen. Osório de Paiva', turnType: 'straight', lat: -3.7938, lng: -38.5985 },
      { id: 'm-030-2', instruction: 'Chegada ao Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-030-v1', instruction: 'Saia do Papicu pela Pontes Vieira', streetName: 'Av. Pontes Vieira', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-030-v2', instruction: 'Chegada ao Terminal Siqueira', streetName: 'Terminal Siqueira', turnType: 'terminal', lat: -3.7938, lng: -38.5985 },
    ],
    stopsIda: [
      { id: 's-030-1', name: 'Terminal Siqueira', code: 'TSIQ-030', lat: -3.7938, lng: -38.5985, order: 1, isTerminal: true },
      { id: 's-030-2', name: 'Av. 13 de Maio / Benfica', code: 'BEN-03', lat: -3.7520, lng: -38.5400, order: 2 },
      { id: 's-030-3', name: 'Terminal Papicu', code: 'TPAP-030', lat: -3.7397, lng: -38.4808, order: 3, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-030-v1', name: 'Terminal Papicu', code: 'TPAP-030', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-030-v2', name: 'Terminal Siqueira', code: 'TSIQ-030', lat: -3.7938, lng: -38.5985, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_030_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_030_VOLTA, 10),
    departures: [{ id: 'dep-030-1', time: '06:05', driverName: 'Antônio Ferreira', vehiclePrefix: '02507', direction: 'ida', status: 'previsto' }],
  },

  // 6. 041 Parangaba / Oliveira Paiva / Papicu
  {
    id: 'line-041',
    code: '041',
    name: 'Parangaba / Oliveira Paiva / Papicu',
    origin: 'Terminal Parangaba',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#0ea5e9',
    speedLimit: 50,
    frequencyMinutes: 12,
    operatingDays: 'Todos os dias',
    activePrefix: '02508',
    streetListIda: ['Terminal Parangaba', 'Av. Dr. Silas Munguba', 'Arena Castelão', 'Av. Oliveira Paiva', 'Av. Washington Soares', 'Terminal Papicu'],
    streetListVolta: ['Terminal Papicu', 'Av. Washington Soares', 'Av. Oliveira Paiva', 'Terminal Parangaba'],
    maneuversIda: [
      { id: 'm-041-1', instruction: 'Saia da Parangaba em direção ao Castelão', streetName: 'Av. Silas Munguba', turnType: 'straight', lat: -3.7745, lng: -38.5630 },
      { id: 'm-041-2', instruction: 'Chegada ao Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-041-v1', instruction: 'Saia do Papicu pela Washington Soares', streetName: 'Av. Washington Soares', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-041-v2', instruction: 'Chegada ao Terminal Parangaba', streetName: 'Terminal Parangaba', turnType: 'terminal', lat: -3.7745, lng: -38.5630 },
    ],
    stopsIda: [
      { id: 's-041-1', name: 'Terminal Parangaba', code: 'TPAR-041', lat: -3.7745, lng: -38.5630, order: 1, isTerminal: true },
      { id: 's-041-2', name: 'Arena Castelão', code: 'CAS-02', lat: -3.7950, lng: -38.5320, order: 2 },
      { id: 's-041-3', name: 'Terminal Papicu', code: 'TPAP-041', lat: -3.7397, lng: -38.4808, order: 3, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-041-v1', name: 'Terminal Papicu', code: 'TPAP-041', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-041-v2', name: 'Terminal Parangaba', code: 'TPAR-041', lat: -3.7745, lng: -38.5630, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_041_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_041_VOLTA, 10),
    departures: [{ id: 'dep-041-1', time: '06:12', driverName: 'Paulo Sérgio', vehiclePrefix: '02508', direction: 'ida', status: 'previsto' }],
  },

  // 7. 050 Siqueira / Papicu / Washington Soares
  {
    id: 'line-050',
    code: '050',
    name: 'Siqueira / Papicu / Washington Soares',
    origin: 'Terminal Siqueira',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#10b981',
    speedLimit: 60,
    frequencyMinutes: 10,
    operatingDays: 'Dias úteis e sábados',
    activePrefix: '02509',
    streetListIda: ['Terminal Siqueira', 'Av. Perimetral', 'Arena Castelão', 'Av. Oliveira Paiva', 'Av. Washington Soares (Unifor)', 'Terminal Papicu'],
    streetListVolta: ['Terminal Papicu', 'Av. Washington Soares', 'Av. Perimetral', 'Terminal Siqueira'],
    maneuversIda: [
      { id: 'm-050-1', instruction: 'Saia do Siqueira e acesse a Perimetral', streetName: 'Av. Perimetral', turnType: 'straight', lat: -3.7938, lng: -38.5985 },
      { id: 'm-050-2', instruction: 'Chegada ao Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-050-v1', instruction: 'Saia do Papicu pela Santana Júnior', streetName: 'Av. Eng. Santana Júnior', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-050-v2', instruction: 'Chegada ao Terminal Siqueira', streetName: 'Terminal Siqueira', turnType: 'terminal', lat: -3.7938, lng: -38.5985 },
    ],
    stopsIda: [
      { id: 's-050-1', name: 'Terminal Siqueira', code: 'TSIQ-050', lat: -3.7938, lng: -38.5985, order: 1, isTerminal: true },
      { id: 's-050-2', name: 'Unifor / Washington Soares', code: 'UNI-050', lat: -3.7850, lng: -38.4850, order: 2 },
      { id: 's-050-3', name: 'Terminal Papicu', code: 'TPAP-050', lat: -3.7397, lng: -38.4808, order: 3, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-050-v1', name: 'Terminal Papicu', code: 'TPAP-050', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-050-v2', name: 'Terminal Siqueira', code: 'TSIQ-050', lat: -3.7938, lng: -38.5985, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_050_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_050_VOLTA, 10),
    departures: [{ id: 'dep-050-1', time: '06:00', driverName: 'Geraldo Magela', vehiclePrefix: '02509', direction: 'ida', status: 'previsto' }],
  },

  // 8. 087 Expresso / Siqueira / Papicu
  {
    id: 'line-087',
    code: '087',
    name: 'Expresso / Siqueira / Papicu',
    origin: 'Terminal Siqueira',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#e11d48',
    speedLimit: 60,
    frequencyMinutes: 8,
    operatingDays: 'Horários de Pico (Dias úteis)',
    activePrefix: '02510',
    streetListIda: ['Terminal Siqueira (Embarque Expresso)', 'Via Expressa Sul / Raul Barbosa', 'Terminal Papicu'],
    streetListVolta: ['Terminal Papicu (Embarque Expresso)', 'Via Expressa Raul Barbosa', 'Terminal Siqueira'],
    maneuversIda: [
      { id: 'm-087-1', instruction: 'Saia do Siqueira na canaleta expressa', streetName: 'Via Expressa', turnType: 'straight', lat: -3.7938, lng: -38.5985 },
      { id: 'm-087-2', instruction: 'Chegada direta ao Terminal Papicu (Linha Direta)', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-087-v1', instruction: 'Saia do Papicu direto pela Via Expressa', streetName: 'Via Expressa', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-087-v2', instruction: 'Chegada direta ao Terminal Siqueira', streetName: 'Terminal Siqueira', turnType: 'terminal', lat: -3.7938, lng: -38.5985 },
    ],
    stopsIda: [
      { id: 's-087-1', name: 'Terminal Siqueira (Embarque Direto)', code: 'TSIQ-EXP', lat: -3.7938, lng: -38.5985, order: 1, isTerminal: true },
      { id: 's-087-2', name: 'Terminal Papicu (Desembarque Direto)', code: 'TPAP-EXP', lat: -3.7397, lng: -38.4808, order: 2, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-087-v1', name: 'Terminal Papicu (Embarque Direto)', code: 'TPAP-EXP', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-087-v2', name: 'Terminal Siqueira (Desembarque Direto)', code: 'TSIQ-EXP', lat: -3.7938, lng: -38.5985, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_087_IDA, 8),
    routePathVolta: generatePath(WAYPOINTS_087_VOLTA, 8),
    departures: [{ id: 'dep-087-1', time: '06:30', driverName: 'Marcio Santos', vehiclePrefix: '02510', direction: 'ida', status: 'previsto' }],
  },

  // 9. 089 Expresso / Parangaba / Papicu
  {
    id: 'line-089',
    code: '089',
    name: 'Expresso / Parangaba / Papicu',
    origin: 'Terminal Parangaba',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#8b5cf6',
    speedLimit: 60,
    frequencyMinutes: 8,
    operatingDays: 'Horários de Pico (Dias úteis)',
    activePrefix: '02511',
    streetListIda: ['Terminal Parangaba (Embarque Expresso)', 'Av. Raul Barbosa Expressa', 'Terminal Papicu'],
    streetListVolta: ['Terminal Papicu (Embarque Expresso)', 'Av. Raul Barbosa Expressa', 'Terminal Parangaba'],
    maneuversIda: [
      { id: 'm-089-1', instruction: 'Saia de Parangaba no corredor expresso', streetName: 'Via Expressa', turnType: 'straight', lat: -3.7745, lng: -38.5630 },
      { id: 'm-089-2', instruction: 'Chegada direta ao Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-089-v1', instruction: 'Saia do Papicu direto para Parangaba', streetName: 'Via Expressa', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-089-v2', instruction: 'Chegada direta ao Terminal Parangaba', streetName: 'Terminal Parangaba', turnType: 'terminal', lat: -3.7745, lng: -38.5630 },
    ],
    stopsIda: [
      { id: 's-089-1', name: 'Terminal Parangaba (Embarque Direto)', code: 'TPAR-EXP', lat: -3.7745, lng: -38.5630, order: 1, isTerminal: true },
      { id: 's-089-2', name: 'Terminal Papicu (Desembarque Direto)', code: 'TPAP-EXP', lat: -3.7397, lng: -38.4808, order: 2, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-089-v1', name: 'Terminal Papicu (Embarque Direto)', code: 'TPAP-EXP', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-089-v2', name: 'Terminal Parangaba (Desembarque Direto)', code: 'TPAR-EXP', lat: -3.7745, lng: -38.5630, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_089_IDA, 8),
    routePathVolta: generatePath(WAYPOINTS_089_VOLTA, 8),
    departures: [{ id: 'dep-089-1', time: '06:30', driverName: 'Roberto Nogueira', vehiclePrefix: '02511', direction: 'ida', status: 'previsto' }],
  },

  // ========================================================
  // MOOVIT EXTRAÇÕES: 12 NOVAS LINHAS OFICIAIS ETUFOR
  // ========================================================

  // 10. 024 Antônio Bezerra / Lagoa / Unifor (Moovit ETUFOR)
  {
    id: 'line-024',
    code: '024',
    name: 'Antônio Bezerra / Lagoa / Unifor',
    origin: 'Terminal Antônio Bezerra',
    destination: 'Unifor / Washington Soares',
    category: 'Troncal',
    color: '#0284c7',
    speedLimit: 50,
    frequencyMinutes: 12,
    operatingDays: 'Todos os dias',
    activePrefix: '02512',
    streetListIda: [
      'Terminal Antônio Bezerra (Plataforma B)',
      'Rua Demétrio Menezes',
      'Av. Jovita Feitosa',
      'Av. José Bastos',
      'Terminal Lagoa',
      'Av. Eduardo Girão',
      'Av. Raul Barbosa',
      'Av. Murilo Borges',
      'Av. Washington Soares (Unifor / Fórum)',
    ],
    streetListVolta: [
      'Av. Washington Soares (Unifor)',
      'Av. Murilo Borges',
      'Av. Eduardo Girão',
      'Terminal Lagoa',
      'Av. José Bastos',
      'Av. Jovita Feitosa',
      'Terminal Antônio Bezerra',
    ],
    maneuversIda: [
      { id: 'm-024-1', instruction: 'Saia do Terminal Antônio Bezerra e pegue a Jovita Feitosa', streetName: 'Av. Jovita Feitosa', turnType: 'straight', lat: -3.7371, lng: -38.5878 },
      { id: 'm-024-2', instruction: 'Acesse a plataforma de conexão do Terminal Lagoa', streetName: 'Terminal Lagoa', turnType: 'terminal', lat: -3.7663, lng: -38.5524 },
      { id: 'm-024-3', instruction: 'Siga pela Av. Murilo Borges até a Washington Soares', streetName: 'Av. Washington Soares', turnType: 'turn-right', lat: -3.7680, lng: -38.5050 },
      { id: 'm-024-4', instruction: 'Ponto final em frente à Unifor', streetName: 'Unifor', turnType: 'straight', lat: -3.7850, lng: -38.4830 },
    ],
    maneuversVolta: [
      { id: 'm-024-v1', instruction: 'Saia da Unifor em direção ao Terminal Lagoa', streetName: 'Av. Murilo Borges', turnType: 'straight', lat: -3.7850, lng: -38.4830 },
      { id: 'm-024-v2', instruction: 'Chegada ao Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878 },
    ],
    stopsIda: [
      { id: 's-024-1', name: 'Terminal Antônio Bezerra (Plat. B)', code: 'TANT-024', lat: -3.7371, lng: -38.5878, order: 1, isTerminal: true },
      { id: 's-024-2', name: 'Av. Jovita Feitosa / Padre Anchieta', code: 'JVF-024', lat: -3.7450, lng: -38.5730, order: 2 },
      { id: 's-024-3', name: 'Terminal Lagoa (Conexão)', code: 'TLAG-024', lat: -3.7663, lng: -38.5524, order: 3, isTerminal: true },
      { id: 's-024-4', name: 'Unifor / Centro de Eventos', code: 'UNI-024', lat: -3.7850, lng: -38.4830, order: 4 },
    ],
    stopsVolta: [
      { id: 's-024-v1', name: 'Unifor / Fórum Clóvis Beviláqua', code: 'UNI-024V', lat: -3.7850, lng: -38.4830, order: 1 },
      { id: 's-024-v2', name: 'Terminal Lagoa', code: 'TLAG-024V', lat: -3.7663, lng: -38.5524, order: 2, isTerminal: true },
      { id: 's-024-v3', name: 'Terminal Antônio Bezerra', code: 'TANT-024V', lat: -3.7371, lng: -38.5878, order: 3, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_024_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_024_VOLTA, 10),
    departures: [{ id: 'dep-024-1', time: '06:00', driverName: 'Fábio Gomes', vehiclePrefix: '02512', direction: 'ida', status: 'previsto' }],
  },

  // 11. 042 Antônio Bezerra / Francisco Sá / Papicu (Moovit ETUFOR)
  {
    id: 'line-042',
    code: '042',
    name: 'Antônio Bezerra / Francisco Sá / Papicu',
    origin: 'Terminal Antônio Bezerra',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#0891b2',
    speedLimit: 50,
    frequencyMinutes: 14,
    operatingDays: 'Todos os dias',
    activePrefix: '02513',
    streetListIda: [
      'Terminal Antônio Bezerra',
      'Av. Tenente Lisboa',
      'Av. Francisco Sá (Corredor Comercial)',
      'Av. Filomeno Gomes',
      'Mercado Central / Dragão do Mar (Centro)',
      'Av. Monsenhor Tabosa',
      'Av. Dom Luís (Meireles / Aldeota)',
      'Terminal Papicu',
    ],
    streetListVolta: [
      'Terminal Papicu',
      'Av. Dom Luís',
      'Centro / Mercado Central',
      'Av. Francisco Sá',
      'Terminal Antônio Bezerra',
    ],
    maneuversIda: [
      { id: 'm-042-1', instruction: 'Saia do Terminal Antônio Bezerra e pegue a Francisco Sá', streetName: 'Av. Francisco Sá', turnType: 'straight', lat: -3.7371, lng: -38.5878 },
      { id: 'm-042-2', instruction: 'Passe pelo Centro próximo ao Mercado Central', streetName: 'Centro Dragão do Mar', turnType: 'straight', lat: -3.7210, lng: -38.5200 },
      { id: 'm-042-3', instruction: 'Entre na Av. Dom Luís e siga até o Papicu', streetName: 'Av. Dom Luís', turnType: 'turn-right', lat: -3.7260, lng: -38.5020 },
      { id: 'm-042-4', instruction: 'Entrada no Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-042-v1', instruction: 'Saia do Papicu pela Dom Luís sentido Centro', streetName: 'Av. Dom Luís', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-042-v2', instruction: 'Chegada ao Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878 },
    ],
    stopsIda: [
      { id: 's-042-1', name: 'Terminal Antônio Bezerra', code: 'TANT-042', lat: -3.7371, lng: -38.5878, order: 1, isTerminal: true },
      { id: 's-042-2', name: 'Av. Francisco Sá / Carlito Pamplona', code: 'FSA-02', lat: -3.7180, lng: -38.5350, order: 2 },
      { id: 's-042-3', name: 'Centro / Dragão do Mar', code: 'DDM-03', lat: -3.7210, lng: -38.5200, order: 3 },
      { id: 's-042-4', name: 'Terminal Papicu', code: 'TPAP-042', lat: -3.7397, lng: -38.4808, order: 4, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-042-v1', name: 'Terminal Papicu', code: 'TPAP-042', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-042-v2', name: 'Terminal Antônio Bezerra', code: 'TANT-042', lat: -3.7371, lng: -38.5878, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_042_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_042_VOLTA, 10),
    departures: [{ id: 'dep-042-1', time: '06:15', driverName: 'Luciano Sales', vehiclePrefix: '02513', direction: 'ida', status: 'previsto' }],
  },

  // 12. 051 Grande Circular I (Moovit ETUFOR)
  {
    id: 'line-051',
    code: '051',
    name: 'Grande Circular I',
    origin: 'Terminal Papicu',
    destination: 'Terminal Papicu (Via Messejana)',
    category: 'Circular',
    color: '#2563eb',
    speedLimit: 55,
    frequencyMinutes: 10,
    operatingDays: 'Todos os dias (24 horas)',
    activePrefix: '02514',
    streetListIda: [
      'Terminal Papicu (Plataforma C)',
      'Av. Eng. Santana Júnior',
      'Av. Washington Soares (Cocó / Cambeba)',
      'Terminal Messejana (Plataforma Troncal)',
      'Av. Perimetral (Passaré / Castelão)',
      'Terminal Parangaba (Plataforma A)',
      'Av. Jovita Feitosa / Pici',
      'Terminal Antônio Bezerra (Plataforma D)',
      'Av. Bezerra de Menezes',
      'Av. Santos Dumont (Aldeota)',
      'Terminal Papicu',
    ],
    streetListVolta: [
      'Terminal Papicu',
      'Av. Santos Dumont',
      'Terminal Antônio Bezerra',
      'Terminal Parangaba',
      'Terminal Messejana',
      'Terminal Papicu',
    ],
    maneuversIda: [
      { id: 'm-051-1', instruction: 'Saia do Terminal Papicu pela Santana Júnior para a Washington Soares', streetName: 'Av. Washington Soares', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-051-2', instruction: 'Integração no Terminal Messejana', streetName: 'Terminal Messejana', turnType: 'terminal', lat: -3.8340, lng: -38.4970 },
      { id: 'm-051-3', instruction: 'Siga pela Perimetral até o Terminal Parangaba', streetName: 'Terminal Parangaba', turnType: 'terminal', lat: -3.7745, lng: -38.5630 },
      { id: 'm-051-4', instruction: 'Integração no Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878 },
      { id: 'm-051-5', instruction: 'Retorno e encerramento do circuito no Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-051-v1', instruction: 'Circuito no sentido inverso', streetName: 'Av. Santos Dumont', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
    ],
    stopsIda: [
      { id: 's-051-1', name: 'Terminal Papicu (Origem)', code: 'TPAP-051', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-051-2', name: 'Terminal Messejana (Integração)', code: 'TMES-051', lat: -3.8340, lng: -38.4970, order: 2, isTerminal: true },
      { id: 's-051-3', name: 'Terminal Parangaba (Integração)', code: 'TPAR-051', lat: -3.7745, lng: -38.5630, order: 3, isTerminal: true },
      { id: 's-051-4', name: 'Terminal Antônio Bezerra (Integração)', code: 'TANT-051', lat: -3.7371, lng: -38.5878, order: 4, isTerminal: true },
      { id: 's-051-5', name: 'Terminal Papicu (Fim do Circuito)', code: 'TPAP-051F', lat: -3.7397, lng: -38.4808, order: 5, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-051-v1', name: 'Terminal Papicu (Origem)', code: 'TPAP-051', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-051-v2', name: 'Terminal Antônio Bezerra', code: 'TANT-051', lat: -3.7371, lng: -38.5878, order: 2, isTerminal: true },
      { id: 's-051-v3', name: 'Terminal Papicu (Fim)', code: 'TPAP-051F', lat: -3.7397, lng: -38.4808, order: 3, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_051_ROTA, 8),
    routePathVolta: generatePath(WAYPOINTS_052_ROTA, 8),
    departures: [{ id: 'dep-051-1', time: '05:30', driverName: 'Manoel Santana', vehiclePrefix: '02514', direction: 'ida', status: 'previsto' }],
  },

  // 13. 052 Grande Circular II (Moovit ETUFOR)
  {
    id: 'line-052',
    code: '052',
    name: 'Grande Circular II',
    origin: 'Terminal Papicu',
    destination: 'Terminal Papicu (Via Antônio Bezerra)',
    category: 'Circular',
    color: '#1d4ed8',
    speedLimit: 55,
    frequencyMinutes: 10,
    operatingDays: 'Todos os dias (24 horas)',
    activePrefix: '02515',
    streetListIda: [
      'Terminal Papicu (Plataforma C)',
      'Av. Santos Dumont (Aldeota)',
      'Av. Bezerra de Menezes',
      'Terminal Antônio Bezerra (Plataforma D)',
      'Av. Jovita Feitosa / Pici',
      'Terminal Parangaba (Plataforma A)',
      'Av. Perimetral (Castelão / Passaré)',
      'Terminal Messejana (Plataforma Troncal)',
      'Av. Washington Soares (Cambeba / Cocó)',
      'Av. Eng. Santana Júnior',
      'Terminal Papicu',
    ],
    streetListVolta: [
      'Terminal Papicu',
      'Av. Washington Soares',
      'Terminal Messejana',
      'Terminal Parangaba',
      'Terminal Antônio Bezerra',
      'Terminal Papicu',
    ],
    maneuversIda: [
      { id: 'm-052-1', instruction: 'Saia do Papicu pela Santos Dumont sentido Bezerra de Menezes', streetName: 'Av. Santos Dumont', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-052-2', instruction: 'Integração no Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878 },
      { id: 'm-052-3', instruction: 'Integração no Terminal Parangaba', streetName: 'Terminal Parangaba', turnType: 'terminal', lat: -3.7745, lng: -38.5630 },
      { id: 'm-052-4', instruction: 'Integração no Terminal Messejana', streetName: 'Terminal Messejana', turnType: 'terminal', lat: -3.8340, lng: -38.4970 },
      { id: 'm-052-5', instruction: 'Conclusão do circuito no Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-052-v1', instruction: 'Circuito horário', streetName: 'Av. Washington Soares', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
    ],
    stopsIda: [
      { id: 's-052-1', name: 'Terminal Papicu (Origem)', code: 'TPAP-052', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-052-2', name: 'Terminal Antônio Bezerra (Integração)', code: 'TANT-052', lat: -3.7371, lng: -38.5878, order: 2, isTerminal: true },
      { id: 's-052-3', name: 'Terminal Parangaba (Integração)', code: 'TPAR-052', lat: -3.7745, lng: -38.5630, order: 3, isTerminal: true },
      { id: 's-052-4', name: 'Terminal Messejana (Integração)', code: 'TMES-052', lat: -3.8340, lng: -38.4970, order: 4, isTerminal: true },
      { id: 's-052-5', name: 'Terminal Papicu (Fim do Circuito)', code: 'TPAP-052F', lat: -3.7397, lng: -38.4808, order: 5, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-052-v1', name: 'Terminal Papicu (Origem)', code: 'TPAP-052', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-052-v2', name: 'Terminal Messejana', code: 'TMES-052', lat: -3.8340, lng: -38.4970, order: 2, isTerminal: true },
      { id: 's-052-v3', name: 'Terminal Papicu (Fim)', code: 'TPAP-052F', lat: -3.7397, lng: -38.4808, order: 3, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_052_ROTA, 8),
    routePathVolta: generatePath(WAYPOINTS_051_ROTA, 8),
    departures: [{ id: 'dep-052-1', time: '05:40', driverName: 'Vicente Paula', vehiclePrefix: '02515', direction: 'ida', status: 'previsto' }],
  },

  // 14. 066 Parangaba / Aeroporto / Papicu (Moovit ETUFOR)
  {
    id: 'line-066',
    code: '066',
    name: 'Parangaba / Aeroporto / Papicu',
    origin: 'Terminal Parangaba',
    destination: 'Terminal Papicu',
    category: 'Troncal',
    color: '#0284c7',
    speedLimit: 60,
    frequencyMinutes: 12,
    operatingDays: 'Todos os dias',
    activePrefix: '02516',
    streetListIda: [
      'Terminal Parangaba',
      'Av. Dr. Silas Munguba',
      'Av. Sen. Carlos Jereissati (Aeroporto Internacional Pinto Martins)',
      'Av. Luciano Carneiro',
      'Av. Borges de Melo',
      'Viaduto Raul Barbosa',
      'Av. Eng. Santana Júnior',
      'Terminal Papicu',
    ],
    streetListVolta: [
      'Terminal Papicu',
      'Av. Raul Barbosa',
      'Av. Borges de Melo',
      'Aeroporto Pinto Martins',
      'Terminal Parangaba',
    ],
    maneuversIda: [
      { id: 'm-066-1', instruction: 'Saia do Terminal Parangaba em direção ao Aeroporto', streetName: 'Av. Carlos Jereissati', turnType: 'straight', lat: -3.7745, lng: -38.5630 },
      { id: 'm-066-2', instruction: 'Acesse o terminal de passageiros do Aeroporto Pinto Martins', streetName: 'Aeroporto Pinto Martins', turnType: 'turn-right', lat: -3.7760, lng: -38.5320 },
      { id: 'm-066-3', instruction: 'Siga pela Raul Barbosa até a Santana Júnior', streetName: 'Av. Raul Barbosa', turnType: 'straight', lat: -3.7480, lng: -38.4980 },
      { id: 'm-066-4', instruction: 'Entrada no Terminal Papicu', streetName: 'Terminal Papicu', turnType: 'terminal', lat: -3.7397, lng: -38.4808 },
    ],
    maneuversVolta: [
      { id: 'm-066-v1', instruction: 'Saia do Papicu pela Raul Barbosa sentido Aeroporto', streetName: 'Av. Raul Barbosa', turnType: 'straight', lat: -3.7397, lng: -38.4808 },
      { id: 'm-066-v2', instruction: 'Chegada ao Terminal Parangaba', streetName: 'Terminal Parangaba', turnType: 'terminal', lat: -3.7745, lng: -38.5630 },
    ],
    stopsIda: [
      { id: 's-066-1', name: 'Terminal Parangaba', code: 'TPAR-066', lat: -3.7745, lng: -38.5630, order: 1, isTerminal: true },
      { id: 's-066-2', name: 'Aeroporto Internacional Pinto Martins', code: 'AER-066', lat: -3.7760, lng: -38.5320, order: 2, landmark: 'Terminal de Passageiros Aeroporto' },
      { id: 's-066-3', name: 'Terminal Papicu', code: 'TPAP-066', lat: -3.7397, lng: -38.4808, order: 3, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-066-v1', name: 'Terminal Papicu', code: 'TPAP-066', lat: -3.7397, lng: -38.4808, order: 1, isTerminal: true },
      { id: 's-066-v2', name: 'Aeroporto Pinto Martins', code: 'AER-066V', lat: -3.7760, lng: -38.5320, order: 2 },
      { id: 's-066-v3', name: 'Terminal Parangaba', code: 'TPAR-066', lat: -3.7745, lng: -38.5630, order: 3, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_066_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_066_VOLTA, 10),
    departures: [{ id: 'dep-066-1', time: '06:25', driverName: 'Daniel Moreira', vehiclePrefix: '02516', direction: 'ida', status: 'previsto' }],
  },

  // 15. 073 Siqueira / Praia de Iracema (Moovit ETUFOR)
  {
    id: 'line-073',
    code: '073',
    name: 'Siqueira / Praia de Iracema',
    origin: 'Terminal Siqueira',
    destination: 'Praia de Iracema / Dragão do Mar',
    category: 'Radial',
    color: '#eab308',
    speedLimit: 50,
    frequencyMinutes: 12,
    operatingDays: 'Todos os dias',
    activePrefix: '02517',
    streetListIda: [
      'Terminal Siqueira',
      'Av. General Osório de Paiva',
      'Av. João Pessoa (Damas)',
      'Av. Carapinima (Benfica / Shopping Benfica)',
      'Av. Tristão Gonçalves (Centro Comercial)',
      'Rua Castro e Silva',
      'Av. Almirante Barroso (Praia de Iracema)',
      'Centro Dragão do Mar de Arte e Cultura',
    ],
    streetListVolta: [
      'Praia de Iracema / Dragão do Mar',
      'Av. Duque de Caxias (Centro)',
      'Av. da Universidade (Benfica)',
      'Av. João Pessoa',
      'Av. General Osório de Paiva',
      'Terminal Siqueira',
    ],
    maneuversIda: [
      { id: 'm-073-1', instruction: 'Saia do Terminal Siqueira pela Av. Osório de Paiva', streetName: 'Av. Gen. Osório de Paiva', turnType: 'straight', lat: -3.7938, lng: -38.5985 },
      { id: 'm-073-2', instruction: 'Passe pelo Benfica na Av. Carapinima', streetName: 'Av. Carapinima', turnType: 'straight', lat: -3.7520, lng: -38.5450 },
      { id: 'm-073-3', instruction: 'Cruze o Centro e acesse a Praia de Iracema', streetName: 'Av. Almirante Barroso', turnType: 'straight', lat: -3.7210, lng: -38.5150 },
    ],
    maneuversVolta: [
      { id: 'm-073-v1', instruction: 'Saia da Praia de Iracema pelo Centro até o Siqueira', streetName: 'Av. Duque de Caxias', turnType: 'straight', lat: -3.7210, lng: -38.5150 },
      { id: 'm-073-v2', instruction: 'Entrada no Terminal Siqueira', streetName: 'Terminal Siqueira', turnType: 'terminal', lat: -3.7938, lng: -38.5985 },
    ],
    stopsIda: [
      { id: 's-073-1', name: 'Terminal Siqueira', code: 'TSIQ-073', lat: -3.7938, lng: -38.5985, order: 1, isTerminal: true },
      { id: 's-073-2', name: 'Shopping Benfica / UFC Humanidades', code: 'BEN-073', lat: -3.7520, lng: -38.5450, order: 2 },
      { id: 's-073-3', name: 'Centro / Praça da Estação', code: 'CEN-073', lat: -3.7300, lng: -38.5300, order: 3 },
      { id: 's-073-4', name: 'Praia de Iracema / Centro Dragão do Mar', code: 'PIR-073', lat: -3.7210, lng: -38.5150, order: 4, landmark: 'Centro Dragão do Mar' },
    ],
    stopsVolta: [
      { id: 's-073-v1', name: 'Praia de Iracema / Dragão do Mar', code: 'PIR-073V', lat: -3.7210, lng: -38.5150, order: 1 },
      { id: 's-073-v2', name: 'Terminal Siqueira', code: 'TSIQ-073', lat: -3.7938, lng: -38.5985, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_073_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_073_VOLTA, 10),
    departures: [{ id: 'dep-073-1', time: '06:10', driverName: 'Claudio Peixoto', vehiclePrefix: '02517', direction: 'ida', status: 'previsto' }],
  },

  // 16. 074 Antônio Bezerra / Unifor (Moovit ETUFOR)
  {
    id: 'line-074',
    code: '074',
    name: 'Antônio Bezerra / Unifor',
    origin: 'Terminal Antônio Bezerra',
    destination: 'Unifor / Fórum Clóvis Beviláqua',
    category: 'Troncal',
    color: '#15803d',
    speedLimit: 50,
    frequencyMinutes: 12,
    operatingDays: 'Dias úteis e sábados',
    activePrefix: '02518',
    streetListIda: [
      'Terminal Antônio Bezerra',
      'Rua Demétrio Menezes',
      'Av. Jovita Feitosa',
      'Av. 13 de Maio (Igreja de Fátima)',
      'Av. Pontes Vieira (Dionísio Torres)',
      'Av. Desembargador Moreira',
      'Av. Washington Soares (Unifor / Centro de Eventos)',
    ],
    streetListVolta: [
      'Unifor / Fórum',
      'Av. Washington Soares',
      'Av. Pontes Vieira',
      'Av. 13 de Maio',
      'Av. Jovita Feitosa',
      'Terminal Antônio Bezerra',
    ],
    maneuversIda: [
      { id: 'm-074-1', instruction: 'Saia do Terminal Antônio Bezerra pela Jovita Feitosa', streetName: 'Av. Jovita Feitosa', turnType: 'straight', lat: -3.7371, lng: -38.5878 },
      { id: 'm-074-2', instruction: 'Siga pela Av. 13 de Maio passando pelo Benfica', streetName: 'Av. 13 de Maio', turnType: 'straight', lat: -3.7520, lng: -38.5400 },
      { id: 'm-074-3', instruction: 'Ponto final em frente ao Campus da Unifor', streetName: 'Av. Washington Soares', turnType: 'terminal', lat: -3.7850, lng: -38.4830 },
    ],
    maneuversVolta: [
      { id: 'm-074-v1', instruction: 'Saia da Unifor pela Washington Soares', streetName: 'Av. Washington Soares', turnType: 'straight', lat: -3.7850, lng: -38.4830 },
      { id: 'm-074-v2', instruction: 'Chegada ao Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878 },
    ],
    stopsIda: [
      { id: 's-074-1', name: 'Terminal Antônio Bezerra', code: 'TANT-074', lat: -3.7371, lng: -38.5878, order: 1, isTerminal: true },
      { id: 's-074-2', name: 'Av. 13 de Maio / Igreja de Fátima', code: 'FAT-074', lat: -3.7520, lng: -38.5400, order: 2 },
      { id: 's-074-3', name: 'Unifor / Fórum Clóvis Beviláqua', code: 'UNI-074', lat: -3.7850, lng: -38.4830, order: 3 },
    ],
    stopsVolta: [
      { id: 's-074-v1', name: 'Unifor / Fórum', code: 'UNI-074V', lat: -3.7850, lng: -38.4830, order: 1 },
      { id: 's-074-v2', name: 'Terminal Antônio Bezerra', code: 'TANT-074', lat: -3.7371, lng: -38.5878, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_074_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_074_VOLTA, 10),
    departures: [{ id: 'dep-074-1', time: '06:05', driverName: 'Marcos Vinicius', vehiclePrefix: '02518', direction: 'ida', status: 'previsto' }],
  },

  // 17. 077 Parangaba / Mucuripe (Moovit ETUFOR)
  {
    id: 'line-077',
    code: '077',
    name: 'Parangaba / Mucuripe',
    origin: 'Terminal Parangaba',
    destination: 'Mucuripe / Beira Mar',
    category: 'Radial',
    color: '#0d9488',
    speedLimit: 50,
    frequencyMinutes: 14,
    operatingDays: 'Todos os dias',
    activePrefix: '02519',
    streetListIda: [
      'Terminal Parangaba',
      'Av. Dr. Silas Munguba',
      'Av. Raul Barbosa',
      'Av. Dom Luís (Aldeota)',
      'Av. Vicente de Castro (Porto do Mucuripe / Mercado dos Peixes)',
    ],
    streetListVolta: [
      'Mucuripe / Mercado dos Peixes',
      'Av. Dom Luís',
      'Av. Raul Barbosa',
      'Terminal Parangaba',
    ],
    maneuversIda: [
      { id: 'm-077-1', instruction: 'Saia da Parangaba pela Raul Barbosa em direção à Aldeota', streetName: 'Av. Raul Barbosa', turnType: 'straight', lat: -3.7745, lng: -38.5630 },
      { id: 'm-077-2', instruction: 'Siga até o Mercado dos Peixes no Mucuripe', streetName: 'Av. Vicente de Castro', turnType: 'terminal', lat: -3.7190, lng: -38.4750 },
    ],
    maneuversVolta: [
      { id: 'm-077-v1', instruction: 'Saia do Mucuripe em direção ao Terminal Parangaba', streetName: 'Av. Raul Barbosa', turnType: 'straight', lat: -3.7190, lng: -38.4750 },
      { id: 'm-077-v2', instruction: 'Chegada ao Terminal Parangaba', streetName: 'Terminal Parangaba', turnType: 'terminal', lat: -3.7745, lng: -38.5630 },
    ],
    stopsIda: [
      { id: 's-077-1', name: 'Terminal Parangaba', code: 'TPAR-077', lat: -3.7745, lng: -38.5630, order: 1, isTerminal: true },
      { id: 's-077-2', name: 'Av. Dom Luís / Aldeota', code: 'ALD-077', lat: -3.7420, lng: -38.4980, order: 2 },
      { id: 's-077-3', name: 'Mucuripe / Mercado dos Peixes', code: 'MUC-077', lat: -3.7190, lng: -38.4750, order: 3, landmark: 'Mercado dos Peixes' },
    ],
    stopsVolta: [
      { id: 's-077-v1', name: 'Mucuripe / Mercado dos Peixes', code: 'MUC-077V', lat: -3.7190, lng: -38.4750, order: 1 },
      { id: 's-077-v2', name: 'Terminal Parangaba', code: 'TPAR-077', lat: -3.7745, lng: -38.5630, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_077_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_077_VOLTA, 10),
    departures: [{ id: 'dep-077-1', time: '06:15', driverName: 'Fernando Costa', vehiclePrefix: '02519', direction: 'ida', status: 'previsto' }],
  },

  // 18. 078 Siqueira / Mucuripe (Moovit ETUFOR)
  {
    id: 'line-078',
    code: '078',
    name: 'Siqueira / Mucuripe',
    origin: 'Terminal Siqueira',
    destination: 'Mucuripe / Beira Mar',
    category: 'Radial',
    color: '#0284c7',
    speedLimit: 50,
    frequencyMinutes: 14,
    operatingDays: 'Todos os dias',
    activePrefix: '02520',
    streetListIda: [
      'Terminal Siqueira',
      'Av. General Osório de Paiva',
      'Av. Gomes de Matos (Montese)',
      'Terminal Lagoa',
      'Av. Pontes Vieira',
      'Av. Desembargador Moreira',
      'Av. Beira Mar / Mucuripe',
    ],
    streetListVolta: [
      'Mucuripe / Beira Mar',
      'Av. Pontes Vieira',
      'Av. Gomes de Matos',
      'Terminal Siqueira',
    ],
    maneuversIda: [
      { id: 'm-078-1', instruction: 'Saia do Siqueira e passe pelo Montese / Lagoa', streetName: 'Av. Gomes de Matos', turnType: 'straight', lat: -3.7938, lng: -38.5985 },
      { id: 'm-078-2', instruction: 'Siga até o Mucuripe na Beira Mar', streetName: 'Av. Beira Mar', turnType: 'terminal', lat: -3.7220, lng: -38.4800 },
    ],
    maneuversVolta: [
      { id: 'm-078-v1', instruction: 'Saia do Mucuripe pela Pontes Vieira para o Siqueira', streetName: 'Av. Pontes Vieira', turnType: 'straight', lat: -3.7220, lng: -38.4800 },
      { id: 'm-078-v2', instruction: 'Chegada ao Terminal Siqueira', streetName: 'Terminal Siqueira', turnType: 'terminal', lat: -3.7938, lng: -38.5985 },
    ],
    stopsIda: [
      { id: 's-078-1', name: 'Terminal Siqueira', code: 'TSIQ-078', lat: -3.7938, lng: -38.5985, order: 1, isTerminal: true },
      { id: 's-078-2', name: 'Terminal Lagoa (Acesso Montese)', code: 'TLAG-078', lat: -3.7663, lng: -38.5524, order: 2, isTerminal: true },
      { id: 's-078-3', name: 'Mucuripe / Beira Mar', code: 'MUC-078', lat: -3.7220, lng: -38.4800, order: 3 },
    ],
    stopsVolta: [
      { id: 's-078-v1', name: 'Mucuripe / Beira Mar', code: 'MUC-078V', lat: -3.7220, lng: -38.4800, order: 1 },
      { id: 's-078-v2', name: 'Terminal Siqueira', code: 'TSIQ-078', lat: -3.7938, lng: -38.5985, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_078_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_078_VOLTA, 10),
    departures: [{ id: 'dep-078-1', time: '06:12', driverName: 'Jorge Linhares', vehiclePrefix: '02520', direction: 'ida', status: 'previsto' }],
  },

  // 19. 082 Antônio Bezerra / Perimetral / Messejana (Moovit ETUFOR Oficial)
  {
    id: 'line-082',
    code: '082',
    name: 'Antônio Bezerra / Perimetral / Messejana',
    origin: 'Terminal Messejana',
    destination: 'Terminal Antônio Bezerra',
    category: 'Troncal',
    color: '#15803d',
    speedLimit: 60,
    frequencyMinutes: 10,
    operatingDays: 'Todos os dias (57 paradas - 51 min)',
    activePrefix: '02521',
    streetListIda: [
      'Terminal Messejana (Plataforma A)',
      'Rodovia BR-116',
      'Av. Presidente Costa e Silva (Perimetral / Jangurussu)',
      'Perimetral / Passaré (Zoo de Fortaleza)',
      'Perimetral / José Walter',
      'Perimetral / Cruzamento Siqueira',
      'Perimetral / Pici (Campus UFC)',
      'Av. Mister Hull',
      'Terminal Antônio Bezerra (Plataforma C)',
    ],
    streetListVolta: [
      'Terminal Antônio Bezerra (Plataforma C)',
      'Av. Mister Hull',
      'Av. Presidente Costa e Silva (Perimetral)',
      'Terminal Siqueira (Acesso Externo)',
      'Perimetral / Passaré',
      'Terminal Messejana',
    ],
    maneuversIda: [
      { id: 'm-082-1', instruction: 'Saia do Terminal Messejana e acesse o Corredor Perimetral', streetName: 'Av. Pres. Costa e Silva', turnType: 'straight', lat: -3.8340, lng: -38.4970 },
      { id: 'm-082-2', instruction: 'Siga pela Perimetral passando pelo cruzamento de Siqueira', streetName: 'Av. Pres. Costa e Silva', turnType: 'straight', lat: -3.7850, lng: -38.5850 },
      { id: 'm-082-3', instruction: 'Acesse a Mister Hull e entre no Terminal Antônio Bezerra', streetName: 'Terminal Antônio Bezerra', turnType: 'terminal', lat: -3.7371, lng: -38.5878, landmark: 'Terminal Antônio Bezerra' },
    ],
    maneuversVolta: [
      { id: 'm-082-v1', instruction: 'Saia do Terminal Antônio Bezerra em direção a Messejana', streetName: 'Av. Pres. Costa e Silva', turnType: 'straight', lat: -3.7371, lng: -38.5878 },
      { id: 'm-082-v2', instruction: 'Entrada no Terminal Messejana', streetName: 'Terminal Messejana', turnType: 'terminal', lat: -3.8340, lng: -38.4970 },
    ],
    stopsIda: [
      { id: 's-082-1', name: 'Terminal Messejana (Plataforma A)', code: 'TMES-082', lat: -3.8340, lng: -38.4970, order: 1, isTerminal: true },
      { id: 's-082-2', name: 'Perimetral / Passaré', code: 'PAS-082', lat: -3.8050, lng: -38.5600, order: 2 },
      { id: 's-082-3', name: 'Perimetral / Siqueira', code: 'SIQ-082', lat: -3.7850, lng: -38.5850, order: 3 },
      { id: 's-082-4', name: 'Terminal Antônio Bezerra', code: 'TANT-082', lat: -3.7371, lng: -38.5878, order: 4, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-082-v1', name: 'Terminal Antônio Bezerra', code: 'TANT-082V', lat: -3.7371, lng: -38.5878, order: 1, isTerminal: true },
      { id: 's-082-v2', name: 'Perimetral / Siqueira', code: 'SIQ-082V', lat: -3.7850, lng: -38.5850, order: 2 },
      { id: 's-082-v3', name: 'Terminal Messejana', code: 'TMES-082V', lat: -3.8340, lng: -38.4970, order: 3, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_082_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_082_VOLTA, 10),
    departures: [{ id: 'dep-082-1', time: '05:50', driverName: 'Aurélio Fontenele', vehiclePrefix: '02521', direction: 'ida', status: 'previsto' }],
  },

  // 20. 084 Siqueira / Perimetral / Messejana (Moovit ETUFOR Oficial)
  {
    id: 'line-084',
    code: '084',
    name: 'Siqueira / Perimetral / Messejana',
    origin: 'Terminal Siqueira',
    destination: 'Terminal Messejana',
    category: 'Troncal',
    color: '#16a34a',
    speedLimit: 60,
    frequencyMinutes: 10,
    operatingDays: 'Todos os dias',
    activePrefix: '02522',
    streetListIda: [
      'Terminal Siqueira',
      'Av. General Osório de Paiva',
      'Av. Presidente Costa e Silva (Perimetral / José Walter)',
      'Perimetral / Passaré',
      'Rodovia BR-116',
      'Terminal Messejana',
    ],
    streetListVolta: [
      'Terminal Messejana',
      'Av. Presidente Costa e Silva',
      'Terminal Siqueira',
    ],
    maneuversIda: [
      { id: 'm-084-1', instruction: 'Saia do Terminal Siqueira para o Corredor Perimetral', streetName: 'Av. Pres. Costa e Silva', turnType: 'straight', lat: -3.7938, lng: -38.5985 },
      { id: 'm-084-2', instruction: 'Chegada ao Terminal Messejana', streetName: 'Terminal Messejana', turnType: 'terminal', lat: -3.8340, lng: -38.4970 },
    ],
    maneuversVolta: [
      { id: 'm-084-v1', instruction: 'Saia de Messejana pela Perimetral em direção ao Siqueira', streetName: 'Av. Pres. Costa e Silva', turnType: 'straight', lat: -3.8340, lng: -38.4970 },
      { id: 'm-084-v2', instruction: 'Chegada ao Terminal Siqueira', streetName: 'Terminal Siqueira', turnType: 'terminal', lat: -3.7938, lng: -38.5985 },
    ],
    stopsIda: [
      { id: 's-084-1', name: 'Terminal Siqueira', code: 'TSIQ-084', lat: -3.7938, lng: -38.5985, order: 1, isTerminal: true },
      { id: 's-084-2', name: 'Perimetral / José Walter', code: 'JWA-084', lat: -3.8020, lng: -38.5750, order: 2 },
      { id: 's-084-3', name: 'Terminal Messejana', code: 'TMES-084', lat: -3.8340, lng: -38.4970, order: 3, isTerminal: true },
    ],
    stopsVolta: [
      { id: 's-084-v1', name: 'Terminal Messejana', code: 'TMES-084', lat: -3.8340, lng: -38.4970, order: 1, isTerminal: true },
      { id: 's-084-v2', name: 'Terminal Siqueira', code: 'TSIQ-084', lat: -3.7938, lng: -38.5985, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_084_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_084_VOLTA, 10),
    departures: [{ id: 'dep-084-1', time: '06:00', driverName: 'Tiago Albuquerque', vehiclePrefix: '02522', direction: 'ida', status: 'previsto' }],
  },

  // 21. 086 Duque de Caxias / Messejana (Moovit ETUFOR)
  {
    id: 'line-086',
    code: '086',
    name: 'Duque de Caxias / Messejana',
    origin: 'Terminal Messejana',
    destination: 'Praça Coração de Jesus (Centro)',
    category: 'Radial',
    color: '#ca8a04',
    speedLimit: 50,
    frequencyMinutes: 12,
    operatingDays: 'Todos os dias',
    activePrefix: '02523',
    streetListIda: [
      'Terminal Messejana',
      'Av. Jornalista Tomaz Coelho',
      'Rodovia BR-116 (Pista Central)',
      'Av. Aguanambi',
      'Av. Domingos Olímpio',
      'Av. Duque de Caxias (Centro Comercial)',
      'Praça Coração de Jesus (Terminal Centro)',
    ],
    streetListVolta: [
      'Praça Coração de Jesus (Centro)',
      'Av. Aguanambi',
      'Rodovia BR-116',
      'Terminal Messejana',
    ],
    maneuversIda: [
      { id: 'm-086-1', instruction: 'Saia do Terminal Messejana e pegue a Rodovia BR-116', streetName: 'Rodovia BR-116', turnType: 'straight', lat: -3.8340, lng: -38.4970 },
      { id: 'm-086-2', instruction: 'Acesse o corredor BRT da Av. Aguanambi', streetName: 'Av. Aguanambi', turnType: 'straight', lat: -3.7650, lng: -38.5250 },
      { id: 'm-086-3', instruction: 'Entre na Av. Duque de Caxias até a Praça Coração de Jesus', streetName: 'Praça Coração de Jesus', turnType: 'terminal', lat: -3.7310, lng: -38.5330 },
    ],
    maneuversVolta: [
      { id: 'm-086-v1', instruction: 'Saia do Centro pela Aguanambi para a BR-116', streetName: 'Av. Aguanambi', turnType: 'straight', lat: -3.7310, lng: -38.5330 },
      { id: 'm-086-v2', instruction: 'Chegada ao Terminal Messejana', streetName: 'Terminal Messejana', turnType: 'terminal', lat: -3.8340, lng: -38.4970 },
    ],
    stopsIda: [
      { id: 's-086-1', name: 'Terminal Messejana', code: 'TMES-086', lat: -3.8340, lng: -38.4970, order: 1, isTerminal: true },
      { id: 's-086-2', name: 'BR-116 / Oliveira Paiva', code: 'BR-086', lat: -3.8050, lng: -38.5050, order: 2 },
      { id: 's-086-3', name: 'Estação Aguanambi / Fátima', code: 'AGU-086', lat: -3.7500, lng: -38.5280, order: 3 },
      { id: 's-086-4', name: 'Praça Coração de Jesus (Centro)', code: 'PCJ-086', lat: -3.7310, lng: -38.5330, order: 4, landmark: 'Terminal Coração de Jesus' },
    ],
    stopsVolta: [
      { id: 's-086-v1', name: 'Praça Coração de Jesus', code: 'PCJ-086', lat: -3.7310, lng: -38.5330, order: 1 },
      { id: 's-086-v2', name: 'Terminal Messejana', code: 'TMES-086', lat: -3.8340, lng: -38.4970, order: 2, isTerminal: true },
    ],
    routePathIda: generatePath(WAYPOINTS_086_IDA, 10),
    routePathVolta: generatePath(WAYPOINTS_086_VOLTA, 10),
    departures: [{ id: 'dep-086-1', time: '06:08', driverName: 'Eduardo Brandão', vehiclePrefix: '02523', direction: 'ida', status: 'previsto' }],
  },
];
