'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';

export default function AdminConfigPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('dates');
    const [loading, setLoading] = useState(true);

    // Data State
    const [dates, setDates] = useState([]);
    const [teams, setTeams] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchConfig();
        }
    }, [user]);

    const fetchConfig = async () => {
        try {
            const [datesRes, teamsRes] = await Promise.all([
                fetch('/api/config/dates'),
                fetch('/api/config/teams')
            ]);

            const datesData = await datesRes.json();
            const teamsData = await teamsRes.json();

            // Ensure we have 5 date slots even if partial
            const dateSlots = Array.from({ length: 15 }, (_, i) => {
                const existing = datesData.find(d => d.day_number === i + 1);
                return existing || { day_number: i + 1, real_date: '' };
            });

            setDates(dateSlots.sort((a, b) => a.day_number - b.day_number));
            setTeams(teamsData);
        } catch (err) {
            showToast({ type: 'error', message: 'Errore caricamento config' });
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dayNum, value) => {
        setDates(prev => prev.map(d => d.day_number === dayNum ? { ...d, real_date: value } : d));
    };

    const saveDates = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = dates.map(d => ({
                dayNumber: d.day_number,
                realDate: d.real_date
            }));

            await fetch('/api/config/dates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dates: payload })
            });

            showToast({ type: 'success', message: 'Date salvate!' });
        } catch (err) {
            showToast({ type: 'error', message: 'Errore salvataggio' });
        } finally {
            setSubmitting(false);
        }
    };

    const updateTeam = async (teamId, field, value) => {
        // Optimistic update
        const oldTeams = [...teams];
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, [field]: value } : t));
    };

    const saveTeam = async (team) => {
        try {
            await fetch(`/api/config/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: team.name, colorHex: team.color_hex || team.color })
            });
            showToast({ type: 'success', message: 'Squadra aggiornata!' });
        } catch (err) {
            showToast({ type: 'error', message: 'Errore salvataggio squadra' });
        }
    };

    if (authLoading || user?.role !== 'admin') {
        if (!authLoading) return <div className="empty-state">🚫 Accesso Negato</div>;
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    if (loading) return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;

    return (
        <div className="config-page animate-fade-in">
            <h1 className="page-title">Configurazione</h1>

            <div className="tabs">
                <button className={`tab ${activeTab === 'dates' ? 'active' : ''}`} onClick={() => setActiveTab('dates')}>
                    Date Giornate
                </button>
                <button className={`tab ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => setActiveTab('locations')}>
                    Location
                </button>
                <button className={`tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
                    Squadre
                </button>
            </div>

            <div className="card">
                {activeTab === 'dates' && (
                    <form onSubmit={saveDates}>
                        <h2 className="section-title">Date</h2>
                        <div className="grid-2">
                            {dates.map(date => (
                                <div key={date.day_number} className="form-group">
                                    <label>Giorno {date.day_number}</label>
                                    <input
                                        type="date"
                                        value={date.real_date || ''}
                                        onChange={(e) => handleDateChange(date.day_number, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Salvataggio...' : 'SALVA TUTTE'}
                        </button>
                    </form>
                )}

                {activeTab === 'locations' && (
                    <div>
                        <h2 className="section-title">Location (Campi)</h2>
                        <p style={{ marginBottom: '1rem', color: 'var(--color-text-medium)' }}>
                            Le location sono usate per generare i turni. Al momento sono fisse nel sistema.
                        </p>
                        <ul style={{ listStyle: 'none' }}>
                            {['Campo 1', 'Campo 2', 'Campo 3'].map((loc, i) => (
                                <li key={i} style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', fontWeight: 'bold' }}>
                                    📍 {loc}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === 'teams' && (
                    <div>
                        <h2 className="section-title">Gestione Squadre</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {teams.map(team => (
                                <div key={team.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
                                    <input
                                        type="color"
                                        value={team.color_hex || '#000000'}
                                        onChange={(e) => updateTeam(team.id, 'color_hex', e.target.value)}
                                        style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={team.name}
                                        onChange={(e) => updateTeam(team.id, 'name', e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => saveTeam(team)}
                                    >
                                        💾 Salva
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
