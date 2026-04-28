import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminGiochi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const day = searchParams.get('day');
        
        if (!day) {
            return NextResponse.json({ message: 'Day parameter is required' }, { status: 400 });
        }

        const db = getDb();
        const { rows } = await db.execute({
            sql: 'SELECT content FROM briefings WHERE day_number = ?',
            args: [parseInt(day)]
        });

        if (rows.length > 0) {
            return NextResponse.json({ content: rows[0].content });
        }

        return NextResponse.json({ content: '' });
    } catch (error) {
        console.error('Error in briefings GET:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        // Only admin or admin_giochi can update the briefing
        await requireAdminGiochi();
        
        const { day_number, content } = await request.json();

        if (!day_number) {
            return NextResponse.json({ message: 'Day parameter is required' }, { status: 400 });
        }

        const db = getDb();
        await db.execute({
            sql: `
                INSERT INTO briefings (day_number, content, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(day_number) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP
            `,
            args: [parseInt(day_number), content || '']
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error.message === 'Forbidden') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
        console.error('Error in briefings PUT:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
