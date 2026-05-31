import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function clearResults() {
    console.log('--- REIMPOSTAZIONE RISULTATI PARTITE A 0 ---');
    try {
        // 1. Reset all match fields to null / scheduled
        console.log('Resetting matches...');
        const resMatches = await db.execute(`
            UPDATE matches 
            SET 
                score_home = NULL, 
                score_away = NULL, 
                status = 'scheduled', 
                referee = NULL, 
                referee_notes = NULL, 
                updated_by = NULL, 
                updated_at = NULL
        `);
        console.log(`Updated ${resMatches.rowsAffected} matches.`);

        // 2. Clear all bonus_malus entries to restart standings from 0
        console.log('Clearing bonus/malus...');
        const resBonus = await db.execute('DELETE FROM bonus_malus');
        console.log(`Deleted ${resBonus.rowsAffected} bonus_malus records.`);

        // 3. Clear sequence for bonus_malus
        await db.execute("DELETE FROM sqlite_sequence WHERE name='bonus_malus'");

        console.log('✅ SUCCESS: Tutti i risultati sono stati azzerati e le partite riportate a scheduled!');
    } catch (err) {
        console.error('❌ ERRORE durante il reset:', err);
    }
}

clearResults();
