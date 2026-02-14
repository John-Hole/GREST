import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, createTokenCookie } from '@/lib/auth';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ message: 'Username e password richiesti' }, { status: 400 });
        }

        const db = getDb();
        const { rows } = await db.execute({
            sql: 'SELECT * FROM users WHERE username = ?',
            args: [username]
        });
        const user = rows[0];

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return NextResponse.json({ message: 'Credenziali non valide' }, { status: 401 });
        }

        // Create JWT
        const token = await signToken({
            userId: user.id,
            username: user.username,
            role: user.role,
        });

        // Set cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });

        response.headers.set('Set-Cookie', createTokenCookie(token));

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Errore interno del server' }, { status: 500 });
    }
}
