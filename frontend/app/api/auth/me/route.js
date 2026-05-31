import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const userPayload = await getAuthUser();

        if (!userPayload) {
            return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
        }

        // Fetch latest data from DB to get theme
        const db = getDb();
        const { rows } = await db.execute({
            sql: 'SELECT theme, team_id FROM users WHERE id = ?',
            args: [userPayload.userId]
        });

        const theme = rows.length > 0 ? rows[0].theme : 'light';

        return NextResponse.json({
            user: {
                id: userPayload.userId,
                username: userPayload.username,
                role: userPayload.role,
                mustChangePassword: !!userPayload.mustChangePassword,
                theme: theme,
                team_id: rows.length > 0 ? rows[0].team_id : null,
            },
        });
    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json({ message: 'Errore interno del server' }, { status: 500 });
    }
}
