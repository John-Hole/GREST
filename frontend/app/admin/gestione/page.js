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

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchStartDate();
            fetchTeams();
        }
    }, [user]);

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
        <div className="container" style={{ padding: 'var(--spacing-lg)' }}>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚙️</span> Gestione Torneo
            </h1>

            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 'var(--spacing-lg)', 
                alignItems: 'flex-start' 
            }}>
                {/* General Settings Card */}
                <div className="card animate-fade-in" style={{ flex: '1 1 400px', minWidth: '320px' }}>
                    <h2 className="section-title">
                        <span>📅</span> Impostazioni Generali
                    </h2>

                    {msg && (
                        <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem' }}>
                            {msg.text}
                        </div>
                    )}

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Data di Inizio Torneo</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-medium)', marginBottom: '1rem' }}>
                            Ricalcola automaticamente le date delle 15 giornate (esclusi weekend).
                        </p>
                        <input
                            type="date"
                            className="input-field"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{ maxWidth: '100%' }}
                        />
                    </div>

                    <button 
                        className="btn btn-primary" 
                        style={{ width: '100%' }}
                        onClick={handleSave} 
                        disabled={saving || !startDate}
                    >
                        {saving ? 'Salvataggio...' : '💾 Salva Impostazioni'}
                    </button>
                </div>

                {/* Teams Management Card */}
                <div className="card animate-fade-in" style={{ flex: '2 1 600px', minWidth: '320px' }}>
                    <h2 className="section-title">
                        <span>👥</span> Gestione Squadre
                    </h2>

                    {teamMsg && (
                        <div className={`notification ${teamMsg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem' }}>
                            {teamMsg.text}
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: 'var(--color-text-medium)', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '0 1rem' }}>ID</th>
                                    <th style={{ padding: '0 1rem' }}>Nome Squadra</th>
                                    <th style={{ padding: '0 1rem', width: '80px' }}>Colore</th>
                                    <th style={{ padding: '0 1rem', width: '100px' }}>Azione</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team) => (
                                    <tr key={team.id} style={{ 
                                        backgroundColor: 'var(--color-bg-navbar)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        <td style={{ 
                                            padding: '0.75rem 1rem', 
                                            fontWeight: 'bold', 
                                            color: 'var(--color-primary)',
                                            borderTopLeftRadius: 'var(--radius-sm)',
                                            borderBottomLeftRadius: 'var(--radius-sm)'
                                        }}>
                                            #{team.id}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={team.name}
                                                onChange={(e) => handleTeamChange(team.id, 'name', e.target.value)}
                                                style={{ margin: 0, width: '100%', padding: '6px 10px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <input
                                                type="color"
                                                value={team.color_hex || '#000000'}
                                                onChange={(e) => handleTeamChange(team.id, 'color_hex', e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    height: '34px', 
                                                    padding: '2px', 
                                                    border: '1px solid var(--color-border)', 
                                                    borderRadius: '4px',
                                                    backgroundColor: 'var(--color-bg-card)',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        </td>
                                        <td style={{ 
                                            padding: '0.75rem 1rem',
                                            borderTopRightRadius: 'var(--radius-sm)',
                                            borderBottomRightRadius: 'var(--radius-sm)'
                                        }}>
                                            <button 
                                                className="btn btn-primary btn-sm" 
                                                style={{ width: '100%' }}
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
