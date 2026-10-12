import { createClient } from '@libsql/client';

const TURSO_URL = 'libsql://urbano-devaro.aws-us-east-1.turso.io';
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTE3NjQ2ODMsImlkIjoiMDFhMTJkN2UtNzcwMS03Nzg3LTgzZDktODY4YmQzMjEwYzU2Iiwia2lkIjoiVTdRbzBEZmExY3hLRjNvYzNoTFRGLUtwZ2ljNGFMcEpVMkY3cFpqbnk2MCIsInJpZCI6IjU1ODNhYTdlLTQ1YzEtNGI2Yy05OTE5LTg3ZGM3NTFkNDAxYSJ9.qzoF3JrckvoUrqaF6qc4lqzGsiG5T7v9fYyvZpwq0fOGD9EVznH8dO19KbDO4tCi7S4PhDCWaSRwId47N1qHCw';

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

async function ensureTable() {
  if (!client || isInitialized) return;
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS app_kv (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at INTEGER
      )
    `);
    isInitialized = true;
  } catch (e) {
    console.error('Error creating Turso table:', e);
  }
}

export const TursoService = {
  async isConnected(): Promise<boolean> {
    if (!client) return false;
    try {
      await ensureTable();
      await client.execute('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },

  async get(key: string): Promise<any | null> {
    if (!client) return null;
    try {
      await ensureTable();
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
      await ensureTable();
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
};
