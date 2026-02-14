import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireOperatorOrAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const user = await requireOperatorOrAdmin();
        const id = (await params).id;
        const { scoreHome, scoreAway, refereeNotes } = await request.json();

        const db = getDb();

        // Check if match exists
        const { rows } = await db.execute({
            sql: 'SELECT * FROM matches WHERE id = ?',
            args: [id]
        });
        const match = rows[0];

        if (!match) {
            return NextResponse.json({ message: 'Partita non trovata' }, { status: 404 });
        }

        let status = 'completed';
        let newScoreHome = scoreHome;
        let newScoreAway = scoreAway;

        if ((scoreHome === null || scoreHome === '') && (scoreAway === null || scoreAway === '')) {
            status = 'scheduled';
            newScoreHome = null;
            newScoreAway = null;
        }

        await db.execute({
            sql: `
        UPDATE matches 
        SET score_home = ?, score_away = ?, status = ?, referee_notes = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
            args: [newScoreHome, newScoreAway, status, refereeNotes || null, user.userId, id]
        });

        const { rows: updatedRows } = await db.execute({
            sql: 'SELECT * FROM matches WHERE id = ?',
            args: [id]
        });
        const updatedMatch = updatedRows[0];

        return NextResponse.json({ success: true, match: updatedMatch });
    } catch (error) {
        console.error('Error updating match:', error);
        if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json({ message: 'Errore durante aggiornamento partita' }, { status: 500 });
    }
}
