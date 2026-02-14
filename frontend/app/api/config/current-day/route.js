import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();

        // Find the day of the first 'scheduled' match
        const { rows: firstScheduled } = await db.execute("SELECT day FROM matches WHERE status = 'scheduled' ORDER BY day ASC, time_slot ASC LIMIT 1");

        if (firstScheduled.length > 0) {
            return NextResponse.json({ day: firstScheduled[0].day });
        }

        // Fallback: If no scheduled matches, get the day of the very last match
        const { rows: lastMatch } = await db.execute("SELECT day FROM matches ORDER BY day DESC, time_slot DESC LIMIT 1");

        if (lastMatch.length > 0) {
            return NextResponse.json({ day: lastMatch[0].day });
        }

        // Final fallback
        return NextResponse.json({ day: 1 });
    } catch (error) {
        console.error('Error in current-day API:', error);
        return NextResponse.json({ day: 1 });
    }
}
