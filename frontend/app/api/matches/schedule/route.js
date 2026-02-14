import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';
import { requireAdminGiochi } from '@/lib/auth';

const updateMatchSchema = z.object({
    id: z.number(),
    location: z.string().optional(),
    referee: z.string().optional(),
    game_name: z.string().optional(),
    score_home: z.number().optional(),
    score_away: z.number().optional(),
    status: z.enum(['scheduled', 'completed']).optional(),
});

export async function PUT(request) {
    try {
        await requireAdminGiochi();
        const body = await request.json();
        const db = getDb();

        // Check if it's an array (bulk update) or single object
        const items = Array.isArray(body) ? body : [body];

        const batchCommands = items.map(match => ({
            sql: `
        UPDATE matches 
        SET 
          location = COALESCE(?, location),
          referee = COALESCE(?, referee),
          game_name = COALESCE(?, game_name),
          score_home = COALESCE(?, score_home),
          score_away = COALESCE(?, score_away),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
            args: [
                match.location ?? null,
                match.referee ?? null,
                match.game_name ?? null,
                match.score_home ?? null,
                match.score_away ?? null,
                match.status ?? null,
                match.id
            ]
        }));

        await db.batch(batchCommands, "write");

        return NextResponse.json({ message: 'Matches updated successfully', count: items.length });
    } catch (error) {
        if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        console.error('Error updating matches:', error);
        return NextResponse.json({ message: 'Error updating matches' }, { status: 500 });
    }
}
