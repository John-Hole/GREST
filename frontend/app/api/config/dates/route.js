import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminGiochi } from '@/lib/auth';

export async function GET() {
    try {
        const user = await requireAdminGiochi();
        const db = getDb();
        const { rows: config } = await db.execute('SELECT * FROM tournament_config ORDER BY day_number ASC');
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
}

export async function PUT(request) {
    try {
        const user = await requireAdminGiochi();
        const { dates } = await request.json();

        const db = getDb();

        const batchCommands = dates.map(item => ({
            sql: `
        INSERT INTO tournament_config (day_number, real_date)
        VALUES (?, ?)
        ON CONFLICT(day_number) DO UPDATE SET real_date = excluded.real_date
      `,
            args: [item.dayNumber, item.realDate]
        }));

        await db.batch(batchCommands, "write");

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
    }
}
