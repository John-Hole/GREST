'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';

export default function LaMiaSquadra() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [matches, setMatches] = useState([]);
    const [standings, setStandings] = useState([]);
    const [teams, setTeams] = useState([]);
    const [myTeam, setMyTeam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || !user.team_id)) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.team_id) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [matchesRes, standingsRes, teamsRes] = await Promise.all([
                fetch('/api/matches'),
                fetch('/api/standings'),
                fetch('/api/config/teams')
            ]);

            if (matchesRes.ok && standingsRes.ok && teamsRes.ok) {
                const matchesData = await matchesRes.json();
                const standingsData = await standingsRes.json();
                const teamsData = await teamsRes.json();

                setTeams(teamsData);
                const currentTeam = teamsData.find(t => t.id === user.team_id);
                setMyTeam(currentTeam);

                // Filter matches for my team
                const myMatches = matchesData.filter(m => 
                    m.teamHomeId === user.team_id || m.teamAwayId === user.team_id
                );
                
                // Sort by day and time slot
                myMatches.sort((a, b) => {
                    if (a.day !== b.day) return a.day - b.day;
                    return (a.timeSlot || '').localeCompare(b.timeSlot || '');
                });

                setMatches(myMatches);
                setStandings(standingsData.standings || []);
            }
        } catch (error) {
            console.error('Error fetching data for La Mia Squadra:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    if (!user || !user.team_id || !myTeam) return null;

    // Group matches by day
    const matchesByDay = matches.reduce((acc, match) => {
        if (!acc[match.day]) acc[match.day] = [];
        acc[match.day].push(match);
        return acc;
    }, {});

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1rem 1.5rem',
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                borderLeft: `6px solid ${myTeam.color_hex || 'var(--color-primary)'}`
            }}>
                <span style={{ fontSize: '2rem' }}>👕</span>
                <div>
                    <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-text-main)' }}>
                        La Mia Squadra
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: myTeam.color_hex || '#000'
                        }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-medium)' }}>
                            {myTeam.name}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* Left Column: Standings */}
                <div>
                    <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🏆 Classifica
                    </h2>
                    <StandingsTable 
                        standings={standings} 
                        isAdmin={false} 
                        highlightTeamId={user.team_id}
                    />
                </div>

                {/* Right Column: Calendar */}
                <div>
                    <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📅 Calendario Partite
                    </h2>
                    
                    {Object.keys(matchesByDay).length === 0 ? (
                        <div className="empty-state">
                            Nessuna partita programmata.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {Object.entries(matchesByDay).map(([day, dayMatches]) => (
                                <div key={day} style={{ 
                                    background: 'var(--color-bg-card)', 
                                    borderRadius: 'var(--radius-md)', 
                                    padding: '1rem',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <h3 style={{ 
                                        fontSize: '1.1rem', 
                                        color: 'var(--color-primary-dark)',
                                        borderBottom: '2px solid var(--color-border)',
                                        paddingBottom: '0.5rem',
                                        marginBottom: '1rem'
                                    }}>
                                        Giornata {day}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {dayMatches.map(match => {
                                            // Ensure team objects have color property for MatchCard
                                            const teamHome = teams.find(t => t.id === match.teamHomeId) || { name: 'Sconosciuta', color_hex: '#ccc' };
                                            const teamAway = teams.find(t => t.id === match.teamAwayId) || { name: 'Sconosciuta', color_hex: '#ccc' };
                                            
                                            const matchWithColors = {
                                                ...match,
                                                teamHome: { ...teamHome, color: teamHome.color_hex },
                                                teamAway: { ...teamAway, color: teamAway.color_hex }
                                            };

                                            return (
                                                <MatchCard 
                                                    key={match.id} 
                                                    match={matchWithColors} 
                                                    isAdminOrOperator={false} 
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
