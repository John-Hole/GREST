import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireArbitro } from '@/lib/auth';

export async function GET() {
    try {
        const user = await requireArbitro();
        const db = getDb();

        // Return joined data
        const { rows: bonuses } = await db.execute(`
      SELECT b.*, t.name as team_name, t.color_hex as team_color, u.username as created_by_name
      FROM bonus_malus b
      JOIN teams t ON b.team_id = t.id
      JOIN users u ON b.created_by = u.id
      ORDER BY b.created_at DESC
    `);

        return NextResponse.json(bonuses);
    } catch (error) {
        if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json({ message: 'Errore server' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await requireArbitro();
        const { teamId, points, reason, day } = await request.json();

        if (!teamId || !reason || !day) {
            return NextResponse.json({ message: 'Dati mancanti' }, { status: 400 });
        }

        const db = getDb();
        const info = await db.execute({
            sql: 'INSERT INTO bonus_malus (team_id, points, reason, day, created_by) VALUES (?, ?, ?, ?, ?)',
            args: [teamId, points, reason, day, user.userId]
        });

        const { rows } = await db.execute({
            sql: 'SELECT * FROM bonus_malus WHERE id = ?',
            args: [Number(info.lastInsertRowid)]
        });
        const newBonus = rows[0];

        return NextResponse.json({ success: true, bonus: newBonus });
    } catch (error) {
        console.error('Bonus error:', error);
        return NextResponse.json({ message: error.message || 'Errore creazione bonus' }, { status: 500 });
    }
}
