const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carica .env.local manualmente se dotenv non lo trova automaticamente
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn(".env.local not found, trying .env");
    dotenv.config();
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error("Errore: TURSO_DATABASE_URL non trovata.");
    process.exit(1);
}

const client = createClient({
    url: url,
    authToken: authToken,
});

async function main() {
    try {
        console.log("Connessione al DB...");
        // Rimuove assegnazione 'Campo 3'
        const rs = await client.execute({
            sql: "UPDATE matches SET location = '' WHERE location = 'Campo 3'",
            args: []
        });
        console.log(`Aggiornate ${rs.rowsAffected} righe. 'Campo 3' rimosso.`);
    } catch (e) {
        console.error("Errore durante l'update:", e);
    }
}

main();
