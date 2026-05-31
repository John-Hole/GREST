import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { requireAuth, signToken, createTokenCookie } from '@/lib/auth';

export async function POST(request) {
    try {
        const user = await requireAuth();
        const { newPassword, teamId } = await request.json();

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { message: 'La password deve essere di almeno 6 caratteri.' },
                { status: 400 }
            );
        }

        const db = getDb();
        const passwordHash = await bcrypt.hash(newPassword, 10);

        if (teamId) {
            await db.execute({
                sql: 'UPDATE users SET password_hash = ?, must_change_password = 0, team_id = ? WHERE id = ?',
                args: [passwordHash, parseInt(teamId), user.userId]
            });
        } else {
            await db.execute({
                sql: 'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
                args: [passwordHash, user.userId]
            });
        }

        // Genera nuovo JWT senza il flag mustChangePassword
        const newToken = await signToken({
            userId: user.userId,
            username: user.username,
            role: user.role,
            mustChangePassword: false,
            team_id: teamId ? parseInt(teamId) : user.team_id,
        });

        const response = NextResponse.json({ success: true });
        response.headers.set('Set-Cookie', createTokenCookie(newToken));

        return response;
    } catch (error) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
        }
        console.error('Change password error:', error);
        return NextResponse.json({ message: 'Errore interno del server' }, { status: 500 });
    }
}
