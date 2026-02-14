import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth';

const userSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(['admin', 'admin_giochi', 'arbitro'], "Ruolo non valido"),
});

export async function GET() {
    try {
        await requireAdmin();
        const db = getDb();
        // Exclude password_hash
        const { rows: users } = await db.execute('SELECT id, username, role, created_at FROM users ORDER BY username ASC');
        return NextResponse.json(users);
    } catch (error) {
        if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await requireAdmin();
        const body = await request.json();
        const validation = userSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { username, password, role } = validation.data;
        const db = getDb();

        // Check if user exists
        const { rows: existingRows } = await db.execute({
            sql: 'SELECT id FROM users WHERE username = ?',
            args: [username]
        });
        if (existingRows.length > 0) {
            return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await db.execute({
            sql: 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            args: [username, passwordHash, role]
        });

        return NextResponse.json({ id: Number(result.lastInsertRowid), username, role }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
    }
}
