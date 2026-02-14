import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const { rows: teams } = await db.execute('SELECT * FROM teams');
        return NextResponse.json(teams);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
