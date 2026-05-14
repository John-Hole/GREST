'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function StatisticheIncontri() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeamId, setSelectedTeamId] = useState('');

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [resTeams, resMatches] = await Promise.all([
                fetch('/api/config/teams'),
                fetch('/api/matches')
            ]);
            
            if (resTeams.ok && resMatches.ok) {
                setTeams(await resTeams.json());
                setMatches(await resMatches.json());
            }
        } catch (error) {
            console.error('Errore nel caricamento dei dati', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    if (!user || user.role !== 'admin') return null;

    // Calc stats for selected team
    let pieData = [];
    let totalPlayed = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsScored = 0;
    let goalsConceded = 0;
    let opponentsData = {};

    if (selectedTeamId) {
        const teamId = parseInt(selectedTeamId);
        
        matches.forEach(m => {
            if (m.teamHome?.id === teamId || m.teamAway?.id === teamId) {
                const isHome = m.teamHome.id === teamId;
                const opponent = isHome ? m.teamAway : m.teamHome;
                const myScore = isHome ? m.scoreHome : m.scoreAway;
                const oppScore = isHome ? m.scoreAway : m.scoreHome;
                
                // Track matches vs opponent (including scheduled ones)
                if (!opponentsData[opponent.id]) {
                    opponentsData[opponent.id] = { name: opponent.name, color: opponent.color || '#ccc', count: 0 };
                }
                opponentsData[opponent.id].count += 1;
                
                // Track results if match is completed (has score)
                if (myScore !== null && myScore !== undefined && oppScore !== null && oppScore !== undefined) {
                    totalPlayed += 1;
                    // Ensure scores are numbers
                    const myScoreNum = Number(myScore);
                    const oppScoreNum = Number(oppScore);
                    
                    goalsScored += myScoreNum;
                    goalsConceded += oppScoreNum;
                    
                    if (myScoreNum > oppScoreNum) wins += 1;
                    else if (myScoreNum < oppScoreNum) losses += 1;
                    else draws += 1;
                }
            }
        });

        pieData = Object.values(opponentsData).sort((a, b) => b.count - a.count);
    }

    // Generate conic gradient for pie chart
    let totalMatchCount = pieData.reduce((acc, curr) => acc + curr.count, 0);
    let conicGradientString = '';
    if (totalMatchCount > 0) {
        let currentPercentage = 0;
        const segments = pieData.map(item => {
            const percentage = (item.count / totalMatchCount) * 100;
            const start = currentPercentage;
            const end = currentPercentage + percentage;
            currentPercentage = end;
            return `${item.color} ${start}% ${end}%`;
        });
        conicGradientString = `conic-gradient(${segments.join(', ')})`;
    }

    return (
        <div className="container" style={{ padding: '1rem', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => router.push('/admin/gestione')} style={{ padding: '0.5rem 1rem' }}>
                    ← Indietro
                </button>
                <h1 className="page-title" style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📊 Statistiche Incontri
                </h1>
            </div>

            <div className="card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Seleziona Squadra:</label>
                    <select 
                        className="input-field" 
                        value={selectedTeamId} 
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        style={{ width: '100%', maxWidth: '400px' }}
                    >
                        <option value="">-- Seleziona una squadra --</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedTeamId && (
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {/* Distribution Pie Chart */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Distribuzione Avversari</h2>
                        
                        {totalMatchCount > 0 ? (
                            <>
                                <div style={{ 
                                    width: '200px', 
                                    height: '200px', 
                                    borderRadius: '50%', 
                                    background: conicGradientString,
                                    marginBottom: '1.5rem',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                }}></div>
                                
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-text-medium)', marginBottom: '0.5rem' }}>
                                        Totale Incontri: {totalMatchCount}
                                    </div>
                                    {pieData.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--color-bg-light)', borderRadius: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }}></span>
                                                <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                                            </div>
                                            <span>{item.count} ({Math.round(item.count/totalMatchCount*100)}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p style={{ color: 'var(--color-text-medium)' }}>Nessun incontro programmato per questa squadra.</p>
                        )}
                    </div>

                    {/* Altre Statistiche */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Prestazioni (Incontri Giocati)</h2>
                        
                        {totalPlayed > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-bg-light)', borderRadius: '4px' }}>
                                    <span>Partite Giocate:</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{totalPlayed}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(46, 204, 113, 0.1)', borderLeft: '4px solid #2ecc71', borderRadius: '4px' }}>
                                    <span>Vittorie:</span>
                                    <span style={{ fontWeight: 'bold', color: '#2ecc71', fontSize: '1.1rem' }}>{wins}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(241, 196, 15, 0.1)', borderLeft: '4px solid #f1c40f', borderRadius: '4px' }}>
                                    <span>Pareggi:</span>
                                    <span style={{ fontWeight: 'bold', color: '#f1c40f', fontSize: '1.1rem' }}>{draws}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(231, 76, 60, 0.1)', borderLeft: '4px solid #e74c3c', borderRadius: '4px' }}>
                                    <span>Sconfitte:</span>
                                    <span style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '1.1rem' }}>{losses}</span>
                                </div>
                                
                                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-bg-light)', borderRadius: '4px' }}>
                                    <span>Punti Fatti:</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{goalsScored}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-bg-light)', borderRadius: '4px' }}>
                                    <span>Punti Subiti:</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>{goalsConceded}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-bg-light)', borderRadius: '4px' }}>
                                    <span>Differenza Punti:</span>
                                    <span style={{ fontWeight: 'bold', color: (goalsScored - goalsConceded) >= 0 ? '#2ecc71' : '#e74c3c' }}>
                                        {(goalsScored - goalsConceded) > 0 ? '+' : ''}{goalsScored - goalsConceded}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-medium)' }}>Nessun incontro giocato (con risultato) per questa squadra.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
