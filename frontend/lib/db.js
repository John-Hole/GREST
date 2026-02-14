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

  globalThis.__db = client;
  return client;
}
