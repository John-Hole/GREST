import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminGiochi } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const user = await requireAdminGiochi();
        const id = (await params).id;
        const { name, colorHex } = await request.json();

        const db = getDb();
        await db.execute({
            sql: 'UPDATE teams SET name = ?, color_hex = ? WHERE id = ?',
            args: [name, colorHex, id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
    }
}
