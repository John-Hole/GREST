import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const require = createRequire(import.meta.url);
const { generateAllMatches } = require('./lib/round-robin');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function resetMatches() {
    console.log('--- RESET E RIGENERAZIONE PARTITE (BALANCED) ---');
    try {
        // 1. Delete all existing matches
        console.log('Cancellazione partite esistenti...');
        await db.execute('DELETE FROM matches');

        // 2. Clear auto-increment for matches table
        await db.execute("DELETE FROM sqlite_sequence WHERE name='matches'");

        // 3. Generate matches with new balanced algorithm
        console.log('Generazione nuove partite equilibrate...');
        const allMatches = generateAllMatches();

        // 4. Insert into database
        console.log(`Inserimento di ${allMatches.length} partite...`);
        await db.batch(allMatches.map(m => ({
            sql: 'INSERT INTO matches (day, time_slot, location, team_home_id, team_away_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            args: [m.day, m.timeSlot, m.location, m.teamHomeId, m.teamAwayId, 'scheduled']
        })), "write");

        console.log('✅ SUCCESS: Calendario rigenerato con rotazione perfetta delle postazioni!');
    } catch (err) {
        console.error('❌ ERRORE durante il reset:', err);
    }
}

resetMatches();
