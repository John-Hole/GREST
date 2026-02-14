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
        const newTeam = { ...team };
        let rangeTotal = 0;
        let rangeGoalsFor = 0;
        let rangeGoalsAgainst = 0;

        if (newTeam.dailyPoints) {
            // We need to find matches for this team in the range to calculate goalDiff properly
            // BUT the API currently only sends dailyPoints. 
            // WAIT, the API sends match data? No, standings/route.js sends summarized team data.
            // If I want range-specific goalDiff, I'd need match-level data on the client OR an API update.
            // However, common practice in these tournaments is: 
            // Weekly points are for the week, but Goal Diff can be global or range-specific.
            // If the user wants "Settimana 1", they likely want stats for that period.
            // Since I can't calculate range goals without matches, I will show points of the week
            // but keep goalDiff global for sorting, UNLESS I fetch matches too.
            // BUT wait, looking at standings/route.js, it ONLY summarizes.
            // Let's assume for now we use global goalDiff as tie-breaker even for weeks,
            // or I just stick to points. 
            // OPTIMIZATION: I'll accept that for now rangeTotal is the key.
            for (let day = start; day <= end; day++) {
                rangeTotal += (newTeam.dailyPoints[day] || 0);
            }
        }

        newTeam.totalPoints = rangeTotal;
        return newTeam;
    }).sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        // Tie-breaker: Global stats since we don't have range-specific matches here
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
    });

    if (loading) {
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="classifica-page animate-fade-in">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Classifica Torneo</h1>

                <div className="filter-tabs" style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    {[
                        { id: 'general', label: 'Generale' },
                        { id: 's1', label: 'Settimana 1' },
                        { id: 's2', label: 'Settimana 2' },
                        { id: 's3', label: 'Settimana 3' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id)}
                            className={`btn ${viewMode === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                                whiteSpace: 'nowrap',
                                padding: '0.6rem 1.2rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
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
