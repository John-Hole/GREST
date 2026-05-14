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
        <div className="container" style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                <span>⚙️</span> Gestione Torneo
            </h1>

            <div className="card" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Impostazioni Generali</h2>

                {msg && (
                    <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem' }}>
                        {msg.text}
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Data di Inizio Torneo</label>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Impostando questa data, verranno ricalcolate automaticamente le date di tutte le 15 giornate del torneo, saltando i sabati e le domeniche.
                    </p>
                    <input
                        type="date"
                        className="input-field"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    />
                </div>

                <button 
                    className="btn btn-primary" 
                    onClick={handleSave} 
                    disabled={saving || !startDate}
                >
                    {saving ? 'Salvataggio in corso...' : '💾 Salva Impostazioni'}
                </button>
            </div>

            <div className="card" style={{ maxWidth: '800px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>👥</span> Gestione Squadre
                </h2>

                {teamMsg && (
                    <div className={`notification ${teamMsg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem' }}>
                        {teamMsg.text}
                    </div>
                )}

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {teams.map((team) => (
                        <div key={team.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem', 
                            padding: '1rem', 
                            backgroundColor: 'var(--color-bg-navbar)', 
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ width: '40px', fontWeight: 'bold', color: 'var(--color-primary-medium)', fontSize: '1.1rem' }}>
                                #{team.id}
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-medium)', display: 'block', marginBottom: '0.2rem' }}>Nome Squadra</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={team.name}
                                    onChange={(e) => handleTeamChange(team.id, 'name', e.target.value)}
                                    placeholder="Nome Squadra"
                                    style={{ margin: 0, width: '100%' }}
                                />
                            </div>
                            <div style={{ width: '80px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-medium)', display: 'block', marginBottom: '0.2rem' }}>Colore</label>
                                <input
                                    type="color"
                                    value={team.color_hex || '#000000'}
                                    onChange={(e) => handleTeamChange(team.id, 'color_hex', e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        height: '40px', 
                                        padding: '2px', 
                                        border: '1px solid var(--color-border)', 
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'var(--color-bg-card)',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                            <div style={{ alignSelf: 'flex-end' }}>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ padding: '0.6rem 1.2rem' }}
                                    onClick={() => handleUpdateTeam(team)}
                                    disabled={savingTeamId === team.id}
                                >
                                    {savingTeamId === team.id ? '...' : '💾 Salva'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
