import { createClient } from '@libsql/client';

export function getDb() {
  if (globalThis.__db) {
    return globalThis.__db;
  }

  const url = process.env.TURSO_DATABASE_URL || 'file:tournament.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const client = createClient({
    url: url,
    authToken: authToken,
  });

  // Locations table
  client.execute(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `).catch(err => console.error(err));

  // Referees table
  client.execute(`
    CREATE TABLE IF NOT EXISTS referees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `).catch(err => console.error(err));

  globalThis.__db = client;
  return client;
}
