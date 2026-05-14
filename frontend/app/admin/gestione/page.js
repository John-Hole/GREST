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
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="page-title" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>⚙️</span> Gestione Torneo
                </h1>
                <p style={{ color: 'var(--color-text-medium)' }}>Configura i parametri globali e personalizza l'identità delle squadre.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
                
                {/* Section: General Settings */}
                <section>
                    <h2 className="section-title">
                        <span>📅</span> Parametri Temporali
                    </h2>
                    <div className="card animate-fade-in" style={{ maxWidth: '600px', borderLeft: '5px solid var(--color-primary)' }}>
                        {msg && (
                            <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1.5rem' }}>
                                {msg.text}
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ fontSize: '1rem', fontWeight: 'bold' }}>Data di Inizio Torneo</label>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-medium)', marginBottom: '1rem', lineHeight: '1.4' }}>
                                L'impostazione di questa data ricalcolerà automaticamente il calendario per tutte le 15 giornate, 
                                distribuendole sequenzialmente ed escludendo sabati e domeniche.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ flex: 1, fontSize: '1.1rem', padding: '0.75rem' }}
                                />
                                <button 
                                    className="btn btn-primary" 
                                    style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
                                    onClick={handleSave} 
                                    disabled={saving || !startDate}
                                >
                                    {saving ? 'Salvataggio...' : '💾 Salva Data'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Teams Management */}
                <section>
                    <h2 className="section-title">
                        <span>👥</span> Identità Squadre
                    </h2>
                    
                    {teamMsg && (
                        <div className={`notification ${teamMsg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1.5rem', maxWidth: '600px' }}>
                            {teamMsg.text}
                        </div>
                    )}

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '1.5rem' 
                    }}>
                        {teams.map((team) => (
                            <div key={team.id} className="card animate-fade-in" style={{ 
                                padding: '1.5rem', 
                                borderTop: `6px solid ${team.color_hex || 'var(--color-primary)'}`,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.2rem',
                                transition: 'transform 0.2s',
                                hover: { transform: 'translateY(-4px)' }
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="badge badge-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                                        SQUADRA #{team.id}
                                    </span>
                                    <button 
                                        className="btn btn-primary btn-sm" 
                                        style={{ borderRadius: '20px', padding: '4px 16px' }}
                                        onClick={() => handleUpdateTeam(team)}
                                        disabled={savingTeamId === team.id}
                                    >
                                        {savingTeamId === team.id ? '...' : 'Salva'}
                                    </button>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-light)' }}>
                                        Nome Squadra
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={team.name}
                                        onChange={(e) => handleTeamChange(team.id, 'name', e.target.value)}
                                        placeholder="Inserisci nome..."
                                        style={{ width: '100%', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', borderBottom: '2px solid var(--color-border)', borderRadius: 0, padding: '0.5rem 0', background: 'transparent' }}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-light)', display: 'block', marginBottom: '0.5rem' }}>
                                        Colore Sociale
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ 
                                            width: '48px', 
                                            height: '48px', 
                                            borderRadius: '12px', 
                                            backgroundColor: team.color_hex || '#000',
                                            border: '3px solid white',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                        }} />
                                        <input
                                            type="color"
                                            value={team.color_hex || '#000000'}
                                            onChange={(e) => handleTeamChange(team.id, 'color_hex', e.target.value)}
                                            style={{ 
                                                flex: 1,
                                                height: '42px',
                                                cursor: 'pointer',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                padding: '2px',
                                                backgroundColor: 'var(--color-bg-card)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
