import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getDb();
        
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });

        const { rows } = await db.execute({
            sql: "SELECT day_number FROM tournament_config WHERE real_date <= ? ORDER BY real_date DESC LIMIT 1",
            args: [todayStr]
        });

        let realDay = 1;
        if (rows.length > 0) {
            realDay = rows[0].day_number;
        } else {
            const { rows: firstDay } = await db.execute("SELECT day_number FROM tournament_config ORDER BY real_date ASC LIMIT 1");
            if (firstDay.length > 0) {
                realDay = firstDay[0].day_number;
            }
        }

        // Logica activeDay: se sono passate le 17:00, proponi già la giornata successiva
        let activeDay = realDay;
        const hours = now.getHours();
        if (hours >= 17) {
            activeDay = Math.min(realDay + 1, 15);
        }

        return NextResponse.json({ 
            day: activeDay,  // Per compatibilità con i componenti esistenti che usano "day"
            realDay: realDay // Per componenti come il briefing che devono restare sul giorno corrente
        });
    } catch (error) {
        console.error('Error in current-day API:', error);
        return NextResponse.json({ day: 1, realDay: 1 });
    }
}
