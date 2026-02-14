'use client';

import { useState, useEffect } from 'react';
import StandingsTable from '@/components/StandingsTable';
import { useAuth } from '@/components/AuthProvider';

export default function ClassificaPage() {
    const { user } = useAuth();
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState('general');

    const fetchStandings = async () => {
        try {
            const res = await fetch('/api/standings');
            const data = await res.json();
            setStandings(data);
        } catch (err) {
            console.error('Fetch standings error', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStandings();
        const interval = setInterval(fetchStandings, 30000);
        return () => clearInterval(interval);
    }, []);

    const getRange = () => {
        switch (viewMode) {
            case 's1': return { start: 1, end: 5 };
            case 's2': return { start: 6, end: 10 };
            case 's3': return { start: 11, end: 15 };
            default: return { start: 1, end: 15 };
        }
    };

    const { start, end } = getRange();

    // Recalculate standings based on range
    const filteredStandings = standings.map(team => {
        // Create a shallow copy to not mutate state
        const newTeam = { ...team };

        // Calculate totals for the specific range
        let rangeTotal = 0;
        let rangeBonus = 0;

        if (newTeam.dailyPoints) {
            for (let day = start; day <= end; day++) {
                rangeTotal += (newTeam.dailyPoints[day] || 0);
                // Note: dailyPoints already includes bonus. 
                // We don't have separate dailyBonus in this structure easily accessible without parsing.
                // But 'bonusMalusTotal' in API is global.
                // However, StandingsTable displays 'bonusMalusTotal'. 
                // If we want range-specific bonus, we'd need that info.
                // For now, let's just update 'totalPoints' which is the main ranking metric.
                // 'bonusMalusTotal' will remain global or we need to fetch bonus details.
                // API `dailyPoints` includes bonus. So `rangeTotal` is correct points-wise.
                // But the "Bonus" column in table usually shows the aggregate bonus.
                // If user filters S1, maybe they want S1 bonuses?
                // The API doesn't give daily breakdown of bonuses separately in the team object, only total.
                // I'll keep bonusMalusTotal as global for now, or just not display it/display global.
            }
        }

        newTeam.totalPoints = rangeTotal;
        return newTeam;
    }).sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        // Goal diff etc would need finding matches in range... too complex for client-only without more data.
        // Fallback to global stats for tie-breakers? Or just total points.
        return 0;
    });

    if (loading) {
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="classifica-page animate-fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Classifica</h1>
                <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="select-styled"
                    style={{ width: 'auto', minWidth: '150px' }}
                >
                    <option value="general">Generale (1-15)</option>
                    <option value="s1">Settimana 1</option>
                    <option value="s2">Settimana 2</option>
                    <option value="s3">Settimana 3</option>
                </select>
            </div>

            <StandingsTable
                standings={filteredStandings}
                isAdmin={user?.role === 'admin'}
                startDay={start}
                endDay={end}
                useRelativeDays={viewMode !== 'general'}
            />
        </div>
    );
}
