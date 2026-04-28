import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getDb();
        
        // Ottieni la data di oggi formattata come YYYY-MM-DD nel fuso orario italiano
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });

        // Trova l'ultima giornata la cui data reale è <= a oggi
        const { rows } = await db.execute({
            sql: "SELECT day_number FROM tournament_config WHERE real_date <= ? ORDER BY real_date DESC LIMIT 1",
            args: [today]
        });

        if (rows.length > 0) {
            return NextResponse.json({ day: rows[0].day_number });
        }

        // Se oggi è prima dell'inizio del torneo, ritorna il giorno 1
        const { rows: firstDay } = await db.execute("SELECT day_number FROM tournament_config ORDER BY real_date ASC LIMIT 1");
        if (firstDay.length > 0) {
             return NextResponse.json({ day: firstDay[0].day_number });
        }

        return NextResponse.json({ day: 1 });
    } catch (error) {
        console.error('Error in current-day API:', error);
        return NextResponse.json({ day: 1 });
    }
}
