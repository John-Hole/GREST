import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Since round-robin might be CJS, we handle it carefully
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { generateAllMatches } = require('./lib/round-robin');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error('ERRORE: TURSO_DATABASE_URL non definita in .env');
    console.log('Path cercato per .env:', path.join(__dirname, '../.env'));
    process.exit(1);
}

const db = createClient({ url, authToken });

async function init() {
    console.log('Inizializzazione database Turso...');

    try {
        // 1. Create Tables
        await db.batch([
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'operator')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                color_hex TEXT NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 15),
                time_slot TEXT NOT NULL,
                location TEXT,
                team_home_id INTEGER NOT NULL,
                team_away_id INTEGER NOT NULL,
                score_home INTEGER,
                score_away INTEGER,
                status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed')),
                referee TEXT,
                game_name TEXT,
                referee_notes TEXT,
                updated_by INTEGER,
                updated_at DATETIME,
                FOREIGN KEY (team_home_id) REFERENCES teams(id),
                FOREIGN KEY (team_away_id) REFERENCES teams(id),
                FOREIGN KEY (updated_by) REFERENCES users(id)
            )`,
            `CREATE TABLE IF NOT EXISTS bonus_malus (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_id INTEGER NOT NULL,
                points INTEGER NOT NULL,
                reason TEXT NOT NULL,
                day INTEGER NOT NULL,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (team_id) REFERENCES teams(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,
            `CREATE TABLE IF NOT EXISTS tournament_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                day_number INTEGER UNIQUE NOT NULL CHECK(day_number BETWEEN 1 AND 15),
                real_date TEXT NOT NULL
            )`
        ], "write");

        console.log('Tabelle create con successo.');

        // 2. Check if already seeded
        const userCheck = await db.execute('SELECT COUNT(*) as count FROM users');
        if (userCheck.rows[0].count > 0) {
            console.log('Database già popolato. Salto il seed.');
            process.exit(0);
        }

        console.log('Popolamento dati iniziali...');

        // 3. Seed Users
        const adminHash = bcrypt.hashSync('admin123', 10);
        const operatorHash = bcrypt.hashSync('operator123', 10);
        await db.batch([
            { sql: 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', args: ['admin', adminHash, 'admin'] },
            { sql: 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', args: ['operatore', operatorHash, 'operator'] }
        ], "write");

        // 4. Seed Teams
        const teams = [
            ['Squadra 1', '#FF0000'],
            ['Squadra 2', '#0000FF'],
            ['Squadra 3', '#00FF00'],
            ['Squadra 4', '#FFFF00'],
            ['Squadra 5', '#FF00FF'],
            ['Squadra 6', '#00FFFF'],
        ];
        await db.batch(teams.map(t => ({ sql: 'INSERT INTO teams (name, color_hex) VALUES (?, ?)', args: t })), "write");

        // 5. Seed Locations
        const locations = ['Campo 1', 'Campo 2', 'Campo 3', 'Campetto', 'Tetto', 'Salone'];
        await db.batch(locations.map(l => ({ sql: 'INSERT OR IGNORE INTO locations (name) VALUES (?)', args: [l] })), "write");

        // 6. Seed Matches
        const allMatches = generateAllMatches();
        await db.batch(allMatches.map(m => ({
            sql: 'INSERT INTO matches (day, time_slot, location, team_home_id, team_away_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            args: [m.day, m.timeSlot, m.location, m.teamHomeId, m.teamAwayId, 'scheduled']
        })), "write");

        // 7. Seed Config (Dates)
        const dates = [];
        const startDate = new Date('2025-06-16'); // Lunedì
        let current = new Date(startDate);
        let count = 1;
        while (count <= 15) {
            if (current.getDay() !== 0) { // Salta Domenica
                dates.push([count, current.toISOString().split('T')[0]]);
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        await db.batch(dates.map(d => ({ sql: 'INSERT INTO tournament_config (day_number, real_date) VALUES (?, ?)', args: d })), "write");

        console.log('Database Turso popolato correttamente!');
    } catch (err) {
        console.error('Errore durante il seed:', err);
    }
}

init();
