import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user.userId,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        return NextResponse.json({ message: 'Errore interno del server' }, { status: 500 });
    }
}
