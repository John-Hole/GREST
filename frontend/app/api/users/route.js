import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth';

// --- Utility: genera password temporanea leggibile ---
// Esclusi: I, l, O, 0, 1 per evitare confusione visiva
function generateTempPassword(length = 6) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// --- Utility: formatta Nome.Cognome ---
function formatUsername(nome, cognome) {
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return `${capitalize(nome.trim())}.${capitalize(cognome.trim())}`;
}

// Schema per creazione utente (nome + cognome invece di username + password)
const createUserSchema = z.object({
    nome: z.string().min(2, "Nome deve essere almeno 2 caratteri"),
    cognome: z.string().min(2, "Cognome deve essere almeno 2 caratteri"),
    role: z.enum(['admin', 'admin_giochi', 'arbitro', 'animatore'], "Ruolo non valido"),
});

export async function GET() {
    try {
        await requireAdmin();
        const db = getDb();
        // Exclude password_hash
        const { rows: users } = await db.execute('SELECT id, username, role, must_change_password, team_id, created_at FROM users ORDER BY username ASC');
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
        const validation = createUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { nome, cognome, role } = validation.data;
        const db = getDb();

        // Genera username base Nome.Cognome
        let baseUsername = formatUsername(nome, cognome);
        let username = baseUsername;

        // Controlla duplicati e aggiungi numero incrementale se necessario
        let counter = 1;
        while (true) {
            const { rows: existingRows } = await db.execute({
                sql: 'SELECT id FROM users WHERE username = ?',
                args: [username]
            });
            if (existingRows.length === 0) break;
            counter++;
            username = `${baseUsername}${counter}`;
        }

        // Genera password temporanea
        const tempPassword = generateTempPassword(6);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const result = await db.execute({
            sql: 'INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, ?, 1)',
            args: [username, passwordHash, role]
        });

        return NextResponse.json({
            id: Number(result.lastInsertRowid),
            username,
            temporaryPassword: tempPassword,
            role
        }, { status: 201 });
    } catch (error) {
        if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        console.error('Error creating user:', error);
        return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await requireAdmin();
        const body = await request.json();
        let { id, resetPassword, role, team_id } = body;

        console.log(`PUT /api/users called for ID: ${id}, Role update: ${role}, Reset password: ${!!resetPassword}, Team ID: ${team_id}`);

        if (!id) {
            return NextResponse.json({ message: 'ID mancante' }, { status: 400 });
        }

        // Ensure ID is integer
        const userId = parseInt(id, 10);
        if (isNaN(userId)) {
            return NextResponse.json({ message: 'ID non valido' }, { status: 400 });
        }

        const db = getDb();
        const updates = [];
        const params = [];
        let tempPassword = null;

        if (resetPassword) {
            // Genera nuova password temporanea
            tempPassword = generateTempPassword(6);
            const hash = await bcrypt.hash(tempPassword, 10);
            updates.push("password_hash = ?");
            params.push(hash);
            updates.push("must_change_password = 1");
            console.log(`Temporary password generated for user ${userId}`);
        }

        if (role) {
            const validRoles = ['admin', 'admin_giochi', 'arbitro', 'animatore'];
            if (!validRoles.includes(role)) {
                return NextResponse.json({ message: 'Ruolo non valido' }, { status: 400 });
            }
            updates.push("role = ?");
            params.push(role);
        }

        if (team_id !== undefined) {
            updates.push("team_id = ?");
            params.push(team_id === null || team_id === '' ? null : parseInt(team_id));
        }

        if (updates.length === 0) {
            return NextResponse.json({ message: 'Nessun dato da aggiornare' }, { status: 400 });
        }

        params.push(userId);

        const result = await db.execute({
            sql: `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
            args: params
        });

        console.log(`Update execution result: rowsAffected=${result.rowsAffected}`);

        if (result.rowsAffected === 0) {
            return NextResponse.json({ message: 'Utente non trovato o nessuna modifica' }, { status: 404 });
        }

        const response = { success: true };
        if (tempPassword) {
            response.temporaryPassword = tempPassword;
        }

        return NextResponse.json(response);
    } catch (error) {
        if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        console.error('Error updating user:', error);
        return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID mancante' }, { status: 400 });
        }

        const db = getDb();
        await db.execute({
            sql: 'DELETE FROM users WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        console.error('Error deleting user:', error);
        return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
    }
}
