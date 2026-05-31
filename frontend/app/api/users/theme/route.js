import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
        }

        const db = getDb();
        const { rows } = await db.execute({
            sql: 'SELECT theme FROM users WHERE id = ?',
            args: [user.userId]
        });

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Utente non trovato' }, { status: 404 });
        }

        return NextResponse.json({ theme: rows[0].theme || 'light' });
    } catch (error) {
        console.error('Error fetching theme:', error);
        return NextResponse.json({ message: 'Errore interno del server' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
        }

        const { theme } = await request.json();
        if (!theme || (theme !== 'light' && theme !== 'dark')) {
            return NextResponse.json({ message: 'Tema non valido' }, { status: 400 });
        }

        const db = getDb();
        await db.execute({
            sql: 'UPDATE users SET theme = ? WHERE id = ?',
            args: [theme, user.userId]
        });

        return NextResponse.json({ success: true, theme });
    } catch (error) {
        console.error('Error updating theme:', error);
        return NextResponse.json({ message: 'Errore interno del server' }, { status: 500 });
    }
}
