import { createClient } from '@libsql/client';

const url = 'libsql://grest-john-hole.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEwOTA0ODQsImlkIjoiN2I3ZTg5YmUtZGM4Ny00ZTkxLWI1NjktZDA1YTEyYjc1ZTI3IiwicmlkIjoiYjQwYWMxNTMtZmNjZi00NjBkLWEyNjMtZDAyNGNkMDUwOGJhIn0.kkw3lx29NiHI2Z3v191boS3eMYmjB7dbvhItfuteVlCbIXTtLh8PQw9N3WNZxwW4FBwn7Seeii5zFpetElYkCg';

const client = createClient({ url, authToken });

async function check() {
    try {
        const { rows } = await client.execute('SELECT * FROM tournament_config ORDER BY day_number ASC');
        console.log("Tournament Config:");
        console.table(rows);

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
        console.log("Today in en-CA:", today);

        const dates = [
            { day_number: 1, real_date: '2026-04-23' },
            { day_number: 2, real_date: '2026-04-24' },
            { day_number: 3, real_date: '2026-04-27' },
            { day_number: 4, real_date: '2026-04-28' },
            { day_number: 5, real_date: '2026-04-29' }
        ];
        
        const batchCommands = dates.map(item => ({
            sql: `
        INSERT INTO tournament_config (day_number, real_date)
        VALUES (?, ?)
        ON CONFLICT(day_number) DO UPDATE SET real_date = excluded.real_date
      `,
            args: [item.day_number, item.real_date]
        }));
        
        console.log("Executing batch...");
        await client.batch(batchCommands, "write");
        console.log("Batch done.");

        const { rows: updated } = await client.execute('SELECT * FROM tournament_config ORDER BY day_number ASC');
        console.log("Updated Config:");
        console.table(updated);

    } catch (e) {
        console.error(e);
    }
}

check();
