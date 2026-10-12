import { createClient } from '@libsql/client';
import { BusLine, BusVehicle } from '../types/bus';
import { FORTALEZA_TERMINALS, BusTerminal } from '../data/fortalezaTerminals';

export const TURSO_URL = 'libsql://urbano-devaro.aws-us-east-1.turso.io';
export const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTE3NjQ2ODMsImlkIjoiMDFhMTJkN2UtNzcwMS03Nzg3LTgzZDktODY4YmQzMjEwYzU2Iiwia2lkIjoiVTdRbzBEZmExY3hLRjNvYzNoTFRGLUtwZ2ljNGFMcEpVMkY3cFpqbnk2MCIsInJpZCI6IjU1ODNhYTdlLTQ1YzEtNGI2Yy05OTE5LTg3ZGM3NTFkNDAxYSJ9.qzoF3JrckvoUrqaF6qc4lqzGsiG5T7v9fYyvZpwq0fOGD9EVznH8dO19KbDO4tCi7S4PhDCWaSRwId47N1qHCw';

let client: ReturnType<typeof createClient> | null = null;

try {
  client = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });
} catch (e) {
  console.error('Failed to initialize Turso client:', e);
}

let isInitialized = false;

async function ensureTables() {
  if (!client || isInitialized) return;
  try {
    // 1. Key-Value Table for full object hydration & instant offline sync
    await client.execute(`
      CREATE TABLE IF NOT EXISTS app_kv (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at INTEGER
      )
    `);

    // 2. Relational Routes Table (readable directly via Turso CLI or SQLite Terminal)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT,
        speed_limit INTEGER,
        frequency_minutes INTEGER,
        operating_days TEXT,
        active_prefix TEXT,
        total_stops_ida INTEGER,
        total_stops_volta INTEGER,
        updated_at INTEGER
      )
    `);

    // 3. Relational Terminals Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS terminals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        code TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        neighborhood TEXT NOT NULL,
        address TEXT
      )
    `);

    // 4. Relational Stops Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS stops (
        id TEXT PRIMARY KEY,
        route_code TEXT NOT NULL,
        direction TEXT NOT NULL,
        stop_order INTEGER NOT NULL,
        name TEXT NOT NULL,
        code TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        is_terminal INTEGER NOT NULL,
        street TEXT,
        landmark TEXT
      )
    `);

    // 5. Relational Vehicles Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        prefix TEXT NOT NULL,
        plate TEXT NOT NULL,
        model TEXT NOT NULL,
        has_ac INTEGER NOT NULL,
        has_lift INTEGER NOT NULL,
        status TEXT NOT NULL,
        current_line_id TEXT
      )
    `);

    isInitialized = true;
  } catch (e) {
    console.error('Error creating Turso tables:', e);
  }
}

export const TursoService = {
  getClient() {
    return client;
  },

  async isConnected(): Promise<boolean> {
    if (!client) return false;
    try {
      await ensureTables();
      await client.execute('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },

  async get(key: string): Promise<any | null> {
    if (!client) return null;
    try {
      await ensureTables();
      const res = await client.execute({
        sql: 'SELECT value FROM app_kv WHERE key = ?',
        args: [key],
      });
      if (res.rows.length > 0 && res.rows[0].value) {
        return JSON.parse(res.rows[0].value as string);
      }
      return null;
    } catch (e) {
      console.error(`Turso get error for ${key}:`, e);
      return null;
    }
  },

  async set(key: string, data: any): Promise<void> {
    if (!client) return;
    try {
      await ensureTables();
      const valueStr = JSON.stringify(data);
      const now = Date.now();
      await client.execute({
        sql: `INSERT INTO app_kv (key, value, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        args: [key, valueStr, now],
      });
    } catch (e) {
      console.error(`Turso set error for ${key}:`, e);
    }
  },

  /**
   * Sincroniza todas as rotas e terminais tanto nas tabelas relacionais SQL quanto no app_kv
   * Garante que quem abre o Turso no terminal CLI veja as tabelas 'routes', 'terminals', 'stops', 'vehicles'
   */
  async syncRelationalData(lines: BusLine[], vehicles: BusVehicle[], terminals: BusTerminal[] = FORTALEZA_TERMINALS): Promise<{ routesCount: number; vehiclesCount: number }> {
    if (!client) throw new Error('Turso client não inicializado');
    await ensureTables();

    const now = Date.now();

    // 1. Sincroniza app_kv para rápida consulta
    await this.set('vfc_bus_lines_v4', lines);
    await this.set('vfc_bus_vehicles_v2', vehicles);

    // 2. Sincroniza Terminais nas tabelas SQL
    for (const term of terminals) {
      await client.execute({
        sql: `INSERT INTO terminals (id, name, short_name, code, lat, lng, neighborhood, address)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                short_name = excluded.short_name,
                code = excluded.code,
                lat = excluded.lat,
                lng = excluded.lng,
                neighborhood = excluded.neighborhood,
                address = excluded.address`,
        args: [term.id, term.name, term.shortName, term.code, term.lat, term.lng, term.neighborhood, term.address],
      });
    }

    // 3. Sincroniza Rotas nas tabelas SQL
    for (const line of lines) {
      await client.execute({
        sql: `INSERT INTO routes (
                id, code, name, origin, destination, category, color,
                speed_limit, frequency_minutes, operating_days, active_prefix,
                total_stops_ida, total_stops_volta, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                code = excluded.code,
                name = excluded.name,
                origin = excluded.origin,
                destination = excluded.destination,
                category = excluded.category,
                color = excluded.color,
                speed_limit = excluded.speed_limit,
                frequency_minutes = excluded.frequency_minutes,
                operating_days = excluded.operating_days,
                active_prefix = excluded.active_prefix,
                total_stops_ida = excluded.total_stops_ida,
                total_stops_volta = excluded.total_stops_volta,
                updated_at = excluded.updated_at`,
        args: [
          line.id,
          line.code,
          line.name,
          line.origin,
          line.destination,
          line.category,
          line.color || '#16a34a',
          line.speedLimit || 50,
          line.frequencyMinutes || 12,
          line.operatingDays || 'Dias úteis',
          line.activePrefix || '',
          line.stopsIda?.length || 0,
          line.stopsVolta?.length || 0,
          now,
        ],
      });

      // Sincroniza paradas de ida e volta da rota
      const allStops = [
        ...(line.stopsIda || []).map((s, idx) => ({ ...s, dir: 'ida', order: idx + 1 })),
        ...(line.stopsVolta || []).map((s, idx) => ({ ...s, dir: 'volta', order: idx + 1 })),
      ];

      for (const stop of allStops) {
        await client.execute({
          sql: `INSERT INTO stops (id, route_code, direction, stop_order, name, code, lat, lng, is_terminal, street, landmark)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  name = excluded.name,
                  code = excluded.code,
                  lat = excluded.lat,
                  lng = excluded.lng,
                  is_terminal = excluded.is_terminal,
                  street = excluded.street,
                  landmark = excluded.landmark`,
          args: [
            stop.id,
            line.code,
            stop.dir,
            stop.order,
            stop.name,
            stop.code || '',
            stop.lat,
            stop.lng,
            stop.isTerminal ? 1 : 0,
            stop.street || '',
            stop.landmark || '',
          ],
        });
      }
    }

    // 4. Sincroniza Veículos nas tabelas SQL
    for (const v of vehicles) {
      await client.execute({
        sql: `INSERT INTO vehicles (id, prefix, plate, model, has_ac, has_lift, status, current_line_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                prefix = excluded.prefix,
                plate = excluded.plate,
                model = excluded.model,
                has_ac = excluded.has_ac,
                has_lift = excluded.has_lift,
                status = excluded.status,
                current_line_id = excluded.current_line_id`,
        args: [
          v.id,
          v.prefix,
          v.plate,
          v.model,
          v.hasAirConditioning ? 1 : 0,
          v.hasAccessibilityLift ? 1 : 0,
          v.status,
          v.currentLineId || '',
        ],
      });
    }

    return { routesCount: lines.length, vehiclesCount: vehicles.length };
  },

  async queryRoutesSql(): Promise<any[]> {
    if (!client) return [];
    try {
      await ensureTables();
      const res = await client.execute('SELECT * FROM routes ORDER BY code ASC');
      return res.rows;
    } catch (e) {
      console.error('Error querying routes:', e);
      return [];
    }
  },
};
