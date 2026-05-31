import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function run() {
  console.log("Starting migration on", url);
  
  // Create a backup of the current users table just in case
  await client.execute(`CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users`);

  // Create new table
  await client.execute(`
    CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        must_change_password INTEGER DEFAULT 0,
        theme TEXT DEFAULT 'light',
        team_id INTEGER REFERENCES teams(id) DEFAULT NULL
    )
  `);

  // Copy data
  await client.execute(`
    INSERT INTO users_new (id, username, password_hash, role, created_at, must_change_password, theme, team_id)
    SELECT id, username, password_hash, role, created_at, must_change_password, theme, team_id FROM users
  `);
  
  await client.execute('DROP TABLE users');
  await client.execute('ALTER TABLE users_new RENAME TO users');
  
  console.log("Migration done successfully.");
}

run().catch(console.error);
