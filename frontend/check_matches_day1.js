const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function run() {
    try {
        console.log("Fetching ALL matches for Day 1...");
        const res = await client.execute("SELECT day, time_slot as timeSlot, team_home_id, team_away_id, location FROM matches WHERE day = 1 ORDER BY timeSlot, id");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
}
run();
