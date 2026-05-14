'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function GestioneTorneo() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [startDate, setStartDate] = useState('');
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingTeamId, setSavingTeamId] = useState(null);
    const [msg, setMsg] = useState(null);
    const [teamMsg, setTeamMsg] = useState(null);
    const [completion, setCompletion] = useState(0);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchStartDate();
            fetchTeams();
            fetchCompletion();
        }
    }, [user]);

    const fetchCompletion = async () => {
        try {
            const [resDay, resMatches] = await Promise.all([
                fetch('/api/config/current-day'),
                fetch('/api/matches')
            ]);
            if (resDay.ok && resMatches.ok) {
                const dayData = await resDay.json();
                const matches = await resMatches.json();
                const currentDay = dayData.realDay || dayData.day || 1;
                const totalDays = matches.length > 0 ? Math.max(...matches.map(m => m.day)) : 1;
                setCompletion(Math.round((currentDay / totalDays) * 100));
            }
        } catch (error) {
            console.error('Errore nel caricamento della percentuale', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const res = await fetch('/api/config/teams');
            if (res.ok) {
                const data = await res.json();
                setTeams(data);
            }
        } catch (error) {
            console.error('Errore nel caricamento delle squadre', error);
        }
    };

    const fetchStartDate = async () => {
        try {
            const res = await fetch('/api/config/start-date');
            if (res.ok) {
                const data = await res.json();
                if (data.startDate) {
                    setStartDate(data.startDate);
                }
            }
        } catch (error) {
            console.error('Errore nel caricamento della data iniziale', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch('/api/config/start-date', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate })
            });

            if (res.ok) {
                setMsg({ type: 'success', text: 'Data di inizio salvata e calendario ricalcolato con successo! Ricaricamento...' });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                const data = await res.json();
                setMsg({ type: 'error', text: data.message || 'Errore durante il salvataggio' });
            }
        } catch (error) {
            setMsg({ type: 'error', text: 'Errore di connessione' });
        } finally {
            setSaving(false);
        }
    };

    const handleTeamChange = (id, field, value) => {
        setTeams(teams.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleUpdateTeam = async (team) => {
        setSavingTeamId(team.id);
        setTeamMsg(null);
        try {
            const res = await fetch(`/api/config/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: team.name, colorHex: team.color_hex })
            });

            if (res.ok) {
                setTeamMsg({ type: 'success', text: `Squadra ${team.name} aggiornata!` });
                setTimeout(() => setTeamMsg(null), 3000);
            } else {
                const data = await res.json();
                setTeamMsg({ type: 'error', text: data.message || 'Errore durante il salvataggio' });
            }
        } catch (error) {
            setTeamMsg({ type: 'error', text: 'Errore di connessione' });
        } finally {
            setSavingTeamId(null);
        }
    };

    if (authLoading || loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="container" style={{ 
            padding: '2rem 1rem', 
            maxWidth: '1100px', 
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
        }}>
            <h1 className="page-title" style={{ 
                fontSize: '1.8rem', 
                marginBottom: '2rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                width: '100%',
                justifyContent: 'flex-start'
            }}>
                <span>⚙️</span> Gestione
            </h1>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
                gap: '2rem', 
                width: '100%',
                alignItems: 'start'
            }}>
                {/* Left Column: Stats and Start Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div 
                        className="card animate-fade-in" 
                        style={{ 
                            padding: '1.5rem', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1.5rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-card-bg)',
                            position: 'relative',
                            overflow: 'hidden'
                        }} 
                        onClick={() => router.push('/admin/statistiche')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                    >
                        <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '50%', 
                            background: `conic-gradient(var(--color-primary) 0% ${completion}%, #e2e8f0 ${completion}% 100%)`, 
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            zIndex: 1
                        }}>
                            {/* Inner circle (Donut) */}
                            <div style={{ 
                                width: '64px', 
                                height: '64px', 
                                borderRadius: '50%', 
                                background: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: '800', 
                                    color: 'var(--color-primary)',
                                    lineHeight: '1'
                                }}>
                                    {completion}%
                                </span>
                                <span style={{ 
                                    fontSize: '0.5rem', 
                                    textTransform: 'uppercase', 
                                    color: 'var(--color-text-light)',
                                    fontWeight: 'bold',
                                    marginTop: '2px'
                                }}>
                                    Progress
                                </span>
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'left', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>📊</span>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: 'var(--color-text-main)' }}>
                                    Statistiche
                                </h2>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-medium)', lineHeight: '1.4', margin: 0 }}>
                                Il torneo è al <strong>{completion}%</strong> del suo percorso.<br/>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '500' }}>Clicca per l'analisi dettagliata →</span>
                            </p>
                        </div>
                    </div>

                    {/* General Settings Card */}
                    <div className="card animate-fade-in" style={{ padding: '1.25rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                            📅 Inizio Torneo
                        </h2>

                        {msg && (
                            <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem', padding: '0.5rem', fontSize: '0.85rem' }}>
                                {msg.text}
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <input
                                type="date"
                                className="input-field"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ width: '100%', marginBottom: '0.75rem' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-medium)', lineHeight: '1.3' }}>
                                Imposta la data per ricalcolare tutte le giornate.
                            </p>
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '0.5rem' }}
                            onClick={handleSave} 
                            disabled={saving || !startDate}
                        >
                            {saving ? 'Salvataggio...' : '💾 Salva Data'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Teams Management Card */}
                <div className="card animate-fade-in" style={{ padding: '1.25rem', height: '100%' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                        👥 Squadre
                    </h2>

                    {teamMsg && (
                        <div className={`notification ${teamMsg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem', padding: '0.5rem', fontSize: '0.85rem' }}>
                            {teamMsg.text}
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-medium)' }}>
                                    <th style={{ padding: '0.5rem 0' }}>Squadra</th>
                                    <th style={{ padding: '0.5rem 0', width: '50px' }}>Colore</th>
                                    <th style={{ padding: '0.5rem 0', width: '80px', textAlign: 'right' }}>Azione</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team) => (
                                    <tr key={team.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.5rem 0' }}>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={team.name}
                                                onChange={(e) => handleTeamChange(team.id, 'name', e.target.value)}
                                                style={{ margin: 0, width: '100%', padding: '4px 8px', fontSize: '0.9rem', border: 'none', background: 'transparent' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem 0' }}>
                                            <input
                                                type="color"
                                                value={team.color_hex || '#000000'}
                                                onChange={(e) => handleTeamChange(team.id, 'color_hex', e.target.value)}
                                                style={{ 
                                                    width: '30px', 
                                                    height: '30px', 
                                                    padding: '0', 
                                                    border: 'none', 
                                                    borderRadius: '4px',
                                                    backgroundColor: 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'block'
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                                            <button 
                                                className="btn btn-primary btn-sm" 
                                                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                                onClick={() => handleUpdateTeam(team)}
                                                disabled={savingTeamId === team.id}
                                            >
                                                {savingTeamId === team.id ? '...' : 'Salva'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
