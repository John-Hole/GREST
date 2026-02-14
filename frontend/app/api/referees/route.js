import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const { rows: referees } = await db.execute('SELECT * FROM referees ORDER BY name ASC');
        return NextResponse.json(referees);
    } catch (error) {
        console.error('Error fetching referees:', error);
        return NextResponse.json({ message: 'Errore durante il recupero degli arbitri' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name } = await request.json();

        if (!name || !name.trim()) {
            return NextResponse.json({ message: 'Nome arbitro obbligatorio' }, { status: 400 });
        }

        const db = getDb();

        // Ensure table exists (defensive programming)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS referees (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL UNIQUE
            )
        `);

        // Check for duplicate
        const { rows: existing } = await db.execute({
            sql: 'SELECT id FROM referees WHERE name = ?',
            args: [name.trim()]
        });

        if (existing.length > 0) {
            return NextResponse.json({ message: 'Arbitro già esistente' }, { status: 409 });
        }

        const result = await db.execute({
            sql: 'INSERT INTO referees (name) VALUES (?)',
            args: [name.trim()]
        });

        return NextResponse.json({ id: Number(result.lastInsertRowid), name: name.trim() }, { status: 201 });
    } catch (error) {
        console.error('Error creating referee:', error);
        return NextResponse.json({ message: 'Errore durante la creazione dell\'arbitro: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID obbligatorio' }, { status: 400 });
        }

        const db = getDb();
        await db.execute({
            sql: 'DELETE FROM referees WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting referee:', error);
        return NextResponse.json({ message: 'Errore durante l\'eliminazione dell\'arbitro' }, { status: 500 });
    }
}
