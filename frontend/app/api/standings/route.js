import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const filterDay = searchParams.get('day'); // Optional filter to see standings up to day X

        const db = getDb();

        // Fetch all teams
        const { rows: teams } = await db.execute('SELECT * FROM teams');

        // Fetch completed matches
        let matchesQuery = "SELECT * FROM matches WHERE status = 'completed'";
        if (filterDay) {
            matchesQuery += ` AND day <= ${parseInt(filterDay)}`;
        }
        const { rows: matches } = await db.execute(matchesQuery);

        // Fetch bonus/malus
        let bonusQuery = 'SELECT * FROM bonus_malus';
        if (filterDay) {
            bonusQuery += ` AND day <= ${parseInt(filterDay)}`;
        }
        const { rows: bonuses } = await db.execute(bonusQuery);


        // Initialize standings map
        const standingsMap = new Map();
        teams.forEach(team => {
            standingsMap.set(team.id, {
                teamId: team.id,
                teamName: team.name,
                colorHex: team.color_hex,
                dailyPoints: Array(16).fill(0), // Index 1-15 for days
                totalPoints: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDiff: 0,
                bonusMalusTotal: 0,
            });
        });

        // Process matches
        matches.forEach(m => {
            const home = standingsMap.get(m.team_home_id);
            const away = standingsMap.get(m.team_away_id);

            if (!home || !away) return; // Should not happen

            // Goals
            home.goalsFor += m.score_home;
            home.goalsAgainst += m.score_away;
            home.goalDiff += (m.score_home - m.score_away);

            away.goalsFor += m.score_away;
            away.goalsAgainst += m.score_home;
            away.goalDiff += (m.score_away - m.score_home);

            // Points
            let homePoints = 0;
            let awayPoints = 0;

            if (m.score_home > m.score_away) {
                homePoints = 3;
            } else if (m.score_home < m.score_away) {
                awayPoints = 3;
            } else {
                homePoints = 1;
                awayPoints = 1;
            }

            // Add to day points
            if (m.day >= 1 && m.day <= 15) {
                home.dailyPoints[m.day] += homePoints;
                away.dailyPoints[m.day] += awayPoints;
            }
        });

        // Process bonuses (Bonus/Malus del giorno vengono sommati ai punti del giorno)
        bonuses.forEach(b => {
            const team = standingsMap.get(b.team_id);
            if (!team) return;

            team.bonusMalusTotal += b.points;

            if (b.day >= 1 && b.day <= 15) {
                team.dailyPoints[b.day] += b.points;
            }
        });

        // Calculate totals and format
        const standings = Array.from(standingsMap.values()).map(t => {
            t.totalPoints = t.dailyPoints.reduce((sum, p) => sum + p, 0);
            return t;
        });

        // Sort: Total Points DESC, Goal Diff DESC, Goals For DESC
        standings.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
            return b.goalsFor - a.goalsFor;
        });

        return NextResponse.json(standings);
    } catch (error) {
        console.error('Error calculating standings:', error);
        return NextResponse.json({ message: 'Errore nel calcolo classifica' }, { status: 500 });
    }
}
