import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';
import { requireAdminGiochi } from '@/lib/auth';

const gameSchema = z.object({
    name: z.string().min(1, "Il nome del gioco è obbligatorio"),
    rules: z.string().optional()
});

const gameUpdateSchema = z.object({
    name: z.string().min(1, "Il nome del gioco è obbligatorio"),
    rules: z.string().optional()
});

async function ensureTableExists(db) {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS games (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          rules TEXT
        )
    `);
}

export async function GET() {
    try {
        const db = getDb();
        await ensureTableExists(db);
        const { rows: games } = await db.execute('SELECT * FROM games ORDER BY name ASC');
        return NextResponse.json(games);
    } catch (error) {
        console.error('Error fetching games:', error);
        return NextResponse.json({ message: 'Errore durante il recupero dei giochi' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const validation = gameSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { name, rules } = validation.data;
        const db = getDb();
        
        await ensureTableExists(db);

        // Check if exists
        const { rows: existingRows } = await db.execute({
            sql: 'SELECT id FROM games WHERE name = ?',
            args: [name.trim()]
        });
        
        if (existingRows.length > 0) {
            return NextResponse.json({ message: 'Gioco già esistente' }, { status: 409 });
        }

        const result = await db.execute({
            sql: 'INSERT INTO games (name, rules) VALUES (?, ?)',
            args: [name.trim(), rules || '']
        });

        return NextResponse.json({ id: Number(result.lastInsertRowid), name: name.trim(), rules: rules || '' }, { status: 201 });
    } catch (error) {
        console.error('Error creating game:', error);
        return NextResponse.json({ message: 'Errore durante la creazione del gioco: ' + error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await requireAdminGiochi();
        
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID obbligatorio' }, { status: 400 });
        }

        const body = await request.json();
        const validation = gameUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { name, rules } = validation.data;
        const db = getDb();

        await ensureTableExists(db);

        // Check for duplicate name if name changed
        const { rows: existing } = await db.execute({
            sql: 'SELECT id FROM games WHERE name = ? AND id != ?',
            args: [name.trim(), id]
        });

        if (existing.length > 0) {
            return NextResponse.json({ message: 'Un altro gioco con questo nome esiste già' }, { status: 409 });
        }

        await db.execute({
            sql: 'UPDATE games SET name = ?, rules = ? WHERE id = ?',
            args: [name.trim(), rules || '', id]
        });

        return NextResponse.json({ id, name: name.trim(), rules: rules || '' });
    } catch (error) {
        if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        console.error('Error updating game:', error);
        return NextResponse.json({ message: 'Errore durante l\'aggiornamento del gioco' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        await requireAdminGiochi();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID obbligatorio' }, { status: 400 });
        }

        const db = getDb();
        await ensureTableExists(db);
        
        await db.execute({
            sql: 'DELETE FROM games WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ message: 'Gioco eliminato' }, { status: 200 });
    } catch (error) {
        if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        console.error('Error deleting game:', error);
        return NextResponse.json({ message: 'Errore durante l\'eliminazione del gioco' }, { status: 500 });
    }
}
