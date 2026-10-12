export interface BusTerminal {
  id: string;
  name: string;
  shortName: string;
  code: string;
  lat: number;
  lng: number;
  address: string;
  neighborhood: string;
  platforms: string[];
}

export const FORTALEZA_TERMINALS: BusTerminal[] = [
  {
    id: 'term-papicu',
    name: 'Terminal Papicu',
    shortName: 'Papicu',
    code: 'TPAP',
    lat: -3.7397,
    lng: -38.4808,
    address: 'Rua Desembargador Lauro Nogueira, 1500 / Av. Eng. Santana Júnior',
    neighborhood: 'Papicu',
    platforms: ['Plataforma A', 'Plataforma B', 'Plataforma C', 'Plataforma D'],
  },
  {
    id: 'term-parangaba',
    name: 'Terminal Parangaba',
    shortName: 'Parangaba',
    code: 'TPAR',
    lat: -3.7745,
    lng: -38.5630,
    address: 'Av. Dr. Silas Munguba, 130 / Rua Eduardo Perdigão',
    neighborhood: 'Parangaba',
    platforms: ['Plataforma A', 'Plataforma B', 'Plataforma C', 'Plataforma D'],
  },
  {
    id: 'term-messejana',
    name: 'Terminal Messejana',
    shortName: 'Messejana',
    code: 'TMES',
    lat: -3.8340,
    lng: -38.4970,
    address: 'Av. Jornalista Tomaz Coelho, 650 / Rua Pergentino Ferreira',
    neighborhood: 'Messejana',
    platforms: ['Plataforma A', 'Plataforma B', 'Plataforma C'],
  },
  {
    id: 'term-antonio-bezerra',
    name: 'Terminal Antônio Bezerra',
    shortName: 'Antônio Bezerra',
    code: 'TANT',
    lat: -3.7371,
    lng: -38.5878,
    address: 'Rua Demétrio Menezes, 3750 / Av. Mister Hull',
    neighborhood: 'Antônio Bezerra',
    platforms: ['Plataforma A', 'Plataforma B', 'Plataforma C', 'Plataforma D'],
  },
  {
    id: 'term-siqueira',
    name: 'Terminal Siqueira',
    shortName: 'Siqueira',
    code: 'TSIQ',
    lat: -3.7938,
    lng: -38.5985,
    address: 'Av. General Osório de Paiva, 2955',
    neighborhood: 'Siqueira / Vila Pery',
    platforms: ['Plataforma A', 'Plataforma B', 'Plataforma C'],
  },
  {
    id: 'term-conjunto-ceara',
    name: 'Terminal Conjunto Ceará',
    shortName: 'Conjunto Ceará',
    code: 'TCC',
    lat: -3.7711,
    lng: -38.6045,
    address: 'Av. Ministro Albuquerque Lima, s/n / Av. A',
    neighborhood: 'Conjunto Ceará',
    platforms: ['Plataforma A', 'Plataforma B'],
  },
  {
    id: 'term-lagoa',
    name: 'Terminal Lagoa',
    shortName: 'Lagoa',
    code: 'TLAG',
    lat: -3.7663,
    lng: -38.5524,
    address: 'Rua Jorge Dumar / Av. Gomes de Matos',
    neighborhood: 'Parreão / Montese',
    platforms: ['Plataforma A', 'Plataforma B'],
  },
];
