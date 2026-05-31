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
    let h2hData = {};

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
                    const myScoreNum = Number(myScore);
                    const oppScoreNum = Number(oppScore);
                    
                    goalsScored += myScoreNum;
                    goalsConceded += oppScoreNum;
                    
                    if (!h2hData[opponent.id]) {
                        h2hData[opponent.id] = { 
                            name: opponent.name, 
                            color: opponent.color || '#ccc', 
                            wins: 0, draws: 0, losses: 0, 
                            gf: 0, ga: 0, 
                            played: 0 
                        };
                    }
                    
                    h2hData[opponent.id].played += 1;
                    h2hData[opponent.id].gf += myScoreNum;
                    h2hData[opponent.id].ga += oppScoreNum;

                    if (myScoreNum > oppScoreNum) {
                        wins += 1;
                        h2hData[opponent.id].wins += 1;
                    } else if (myScoreNum < oppScoreNum) {
                        losses += 1;
                        h2hData[opponent.id].losses += 1;
                    } else {
                        draws += 1;
                        h2hData[opponent.id].draws += 1;
                    }
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
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => router.push('/admin/gestione')} 
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span>←</span> Torna alla Gestione
                    </button>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--color-primary-dark)' }}>
                        📊 Analisi Performance
                    </h1>
                </div>
                
                <div style={{ minWidth: '250px' }}>
                    <select 
                        className="input-field" 
                        value={selectedTeamId} 
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '0.8rem', 
                            borderRadius: '12px', 
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            border: '2px solid var(--color-primary)'
                        }}
                    >
                        <option value="">Seleziona una squadra...</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedTeamId ? (
                <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '4rem', opacity: 0.3 }}>📈</div>
                    <h2 style={{ color: 'var(--color-text-medium)' }}>Seleziona una squadra per visualizzare le statistiche dettagliate</h2>
                    <p style={{ color: 'var(--color-text-light)' }}>Verranno mostrate le distribuzioni degli avversari, i risultati e i confronti diretti.</p>
                </div>
            ) : (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* First Row: Distribution and General Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        
                        {/* Distribution Donut */}
                        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2rem', color: 'var(--color-primary)' }}>Distribuzione Avversari</h2>
                            
                            {totalMatchCount > 0 ? (
                                <>
                                    <div style={{ 
                                        width: '220px', 
                                        height: '220px', 
                                        borderRadius: '50%', 
                                        background: conicGradientString,
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                        marginBottom: '2rem'
                                    }}>
                                        {/* Inner White Circle */}
                                        <div style={{ 
                                            width: '150px', 
                                            height: '150px', 
                                            borderRadius: '50%', 
                                            background: 'white',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
                                        }}>
                                            <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-text-main)' }}>{totalMatchCount}</span>
                                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 'bold' }}>Totale Match</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.8rem' }}>
                                        {pieData.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem', background: 'var(--color-bg-light)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: item.color, flexShrink: 0 }}></div>
                                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-medium)' }}>{item.count} sfide</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: 'var(--color-text-medium)' }}>Nessun incontro programmato.</p>
                            )}
                        </div>

                        {/* Performance Summary */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2rem', color: 'var(--color-primary)' }}>Riepilogo Risultati</h2>
                            
                            {totalPlayed > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ padding: '1rem', background: 'var(--color-bg-light)', border: '1px solid var(--color-border)', borderRadius: '15px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-medium)', marginBottom: '0.5rem' }}>Partite Totali Giocate</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary)' }}>{totalPlayed}</div>
                                    </div>

                                    {/* Big Stats Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div style={{ padding: '1rem', background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '15px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#2e7d32' }}>{wins}</div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#4caf50' }}>Vinte</div>
                                        </div>
                                        <div style={{ padding: '1rem', background: '#fff9c4', border: '1px solid #fff59d', borderRadius: '15px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fbc02d' }}>{draws}</div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#fdd835' }}>Pareggi</div>
                                        </div>
                                        <div style={{ padding: '1rem', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '15px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#c62828' }}>{losses}</div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#f44336' }}>Perse</div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '15px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 'bold' }}>Percentuale di Vittoria</div>
                                        <div style={{ fontSize: '2rem', fontWeight: '900' }}>{Math.round((wins / totalPlayed) * 100)}%</div>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-medium)', textAlign: 'center', marginTop: '2rem' }}>Ancora nessun risultato inserito.</p>
                            )}
                        </div>
                    </div>

                    {/* Head-to-Head Section */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ⚔️ Confronti Diretti (Head-to-Head)
                        </h2>
                        
                        {Object.keys(h2hData).length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.8rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--color-text-light)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                            <th style={{ padding: '0 1rem' }}>Avversario</th>
                                            <th style={{ padding: '0 1rem', textAlign: 'center' }}>G</th>
                                            <th style={{ padding: '0 1rem', textAlign: 'center' }}>V</th>
                                            <th style={{ padding: '0 1rem', textAlign: 'center' }}>P</th>
                                            <th style={{ padding: '0 1rem', textAlign: 'center' }}>S</th>
                                            <th style={{ padding: '0 1rem', textAlign: 'center' }}>Win %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.values(h2hData).sort((a,b) => b.played - a.played).map((h, idx) => (
                                            <tr key={idx} style={{ background: 'var(--color-bg-light)', borderRadius: '15px' }}>
                                                <td style={{ padding: '1rem', borderRadius: '15px 0 0 15px', borderLeft: `6px solid ${h.color}` }}>
                                                    <span style={{ fontWeight: '800' }}>{h.name}</span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>{h.played}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: '#2ecc71', fontWeight: 'bold' }}>{h.wins}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: '#f1c40f', fontWeight: 'bold' }}>{h.draws}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: '#e74c3c', fontWeight: 'bold' }}>{h.losses}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center', borderRadius: '0 15px 15px 0' }}>
                                                    <div style={{ 
                                                        background: 'var(--color-border)', 
                                                        height: '24px', 
                                                        borderRadius: '12px', 
                                                        position: 'relative', 
                                                        overflow: 'hidden',
                                                        minWidth: '80px',
                                                        margin: '0 auto'
                                                    }}>
                                                        <div style={{ 
                                                            background: h.wins > h.losses ? '#2ecc71' : (h.wins < h.losses ? '#e74c3c' : '#f1c40f'),
                                                            width: `${(h.wins/h.played)*100}%`,
                                                            height: '100%',
                                                            transition: 'width 0.5s ease'
                                                        }}></div>
                                                        <span style={{ 
                                                            position: 'absolute', 
                                                            top: '50%', 
                                                            left: '50%', 
                                                            transform: 'translate(-50%, -50%)', 
                                                            fontSize: '0.65rem', 
                                                            fontWeight: '900',
                                                            color: (h.wins/h.played) > 0.5 ? 'white' : 'var(--color-text-main)'
                                                        }}>
                                                            {Math.round((h.wins/h.played)*100)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-medium)', textAlign: 'center', padding: '2rem' }}>Nessun confronto diretto ancora disponibile.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
