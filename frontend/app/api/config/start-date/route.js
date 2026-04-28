import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await requireAdmin();
        const db = getDb();
        const { rows: config } = await db.execute('SELECT * FROM tournament_config WHERE day_number = 1');
        
        let startDate = '';
        if (config.length > 0) {
            startDate = config[0].real_date.split('T')[0];
        }
        
        return NextResponse.json({ startDate });
    } catch (error) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
}

export async function PUT(request) {
    try {
        await requireAdmin();
        const { startDate } = await request.json();
        
        if (!startDate) {
            return NextResponse.json({ message: 'Data di inizio non fornita' }, { status: 400 });
        }

        const db = getDb();
        const dates = [];
        let current = new Date(startDate);
        let count = 1;

        // Ricalcola i 15 giorni saltando sabato e domenica
        while (count <= 15) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
                dates.push({
                    day_number: count,
                    real_date: current.toISOString().split('T')[0]
                });
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        const batchCommands = dates.map(item => ({
            sql: `
        INSERT INTO tournament_config (day_number, real_date)
        VALUES (?, ?)
        ON CONFLICT(day_number) DO UPDATE SET real_date = excluded.real_date
      `,
            args: [item.day_number, item.real_date]
        }));

        await db.batch(batchCommands, "write");

        return NextResponse.json({ success: true, dates });
    } catch (error) {
        return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
    }
}
