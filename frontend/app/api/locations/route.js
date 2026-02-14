import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const locationSchema = z.object({
    name: z.string().min(1, "Location name is required"),
});

export async function GET() {
    try {
        const db = getDb();
        const { rows: locations } = await db.execute('SELECT * FROM locations ORDER BY name ASC');
        return NextResponse.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json({ message: 'Error fetching locations' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const validation = locationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { name } = validation.data;
        const db = getDb();

        // Check if exists
        const { rows: existingRows } = await db.execute({
            sql: 'SELECT id FROM locations WHERE name = ?',
            args: [name]
        });
        if (existingRows.length > 0) {
            return NextResponse.json({ message: 'Location already exists' }, { status: 409 });
        }

        const result = await db.execute({
            sql: 'INSERT INTO locations (name) VALUES (?)',
            args: [name]
        });

        return NextResponse.json({ id: Number(result.lastInsertRowid), name }, { status: 201 });
    } catch (error) {
        console.error('Error creating location:', error);
        return NextResponse.json({ message: 'Error creating location' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID required' }, { status: 400 });
        }

        const db = getDb();
        await db.execute({
            sql: 'DELETE FROM locations WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ message: 'Location deleted' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting location:', error);
        return NextResponse.json({ message: 'Error deleting location' }, { status: 500 });
    }
}
