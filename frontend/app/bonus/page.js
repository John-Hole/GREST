'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';

export default function BonusPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [teams, setTeams] = useState([]);
    const [bonuses, setBonuses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [teamId, setTeamId] = useState('');
    const [points, setPoints] = useState('');
    const [reason, setReason] = useState('');
    const [day, setDay] = useState('1'); // Generic Default
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const allowedRoles = ['admin', 'admin_giochi', 'arbitro'];
        if (!authLoading && (!user || !allowedRoles.includes(user.role))) {
            // Simple client-side protection
            // router.push('/'); // Or just render access denied
        } else if (user && allowedRoles.includes(user.role)) {
            fetchData();
        }
    }, [user, authLoading]);

    const fetchData = async () => {
        try {
            const [teamsRes, bonusesRes] = await Promise.all([
                fetch('/api/config/teams'),
                fetch('/api/bonus')
            ]);

            const teamsData = await teamsRes.json();
            const bonusesData = await bonusesRes.json();

            setTeams(teamsData);
            setBonuses(bonusesData);

            // Select first team default
            if (teamsData.length > 0) setTeamId(teamsData[0].id);

        } catch (err) {
            console.error('Error fetching data', err);
            showToast({ type: 'error', message: 'Errore caricamento dati' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch('/api/bonus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: parseInt(teamId),
                    points: parseInt(points),
                    reason,
                    day: parseInt(day),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                showToast({ type: 'success', message: 'Bonus assegnato!' });
                setPoints('');
                setReason('');
                // Refresh list
                const bonusesRes = await fetch('/api/bonus');
                const bonusesData = await bonusesRes.json();
                setBonuses(bonusesData);
            } else {
                showToast({ type: 'error', message: data.message || 'Errore' });
            }
        } catch (err) {
            showToast({ type: 'error', message: 'Errore server' });
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || !['admin', 'admin_giochi', 'arbitro'].includes(user?.role)) {
        if (!authLoading && !['admin', 'admin_giochi', 'arbitro'].includes(user?.role)) {
            return <div className="empty-state">🚫 Accesso Negato. Area riservata agli amministratori o arbitri.</div>;
        }
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    if (loading) {
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="bonus-page animate-fade-in">
            <h1 className="page-title">Gestione Bonus/Malus</h1>

            <div className="card form-container">
                <h2 className="section-title">Assegna Nuovo Bonus</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Squadra</label>
                            <div className="select-wrapper">
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="select-styled"
                                >
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Giorno di assegnazione (Classifica)</label>
                            <select
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className="select-styled"
                            >
                                {Array.from({ length: 15 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>Giorno {d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Punti (usa negativo per Malus, es: -5)</label>
                        <input
                            type="number"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            required
                            placeholder="Es: 10 o -5"
                        />
                    </div>

                    <div className="form-group">
                        <label>Motivazione</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            placeholder="Es: Vittoria gioco serale"
                            rows="3"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Assegnazione...' : 'ASSEGNA BONUS'}
                    </button>
                </form>
            </div>

            <div className="history-section" style={{ marginTop: '3rem' }}>
                <h2 className="section-title">Storico Bonus Assegnati</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Data</th>
                                <th style={{ textAlign: 'left' }}>Squadra</th>
                                <th style={{ textAlign: 'center' }}>Punti</th>
                                <th style={{ textAlign: 'left' }}>Motivo</th>
                                <th style={{ textAlign: 'center' }}>Giorno</th>
                                <th style={{ textAlign: 'left' }}>Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bonuses.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>Nessun bonus assegnato</td></tr>
                            ) : (
                                bonuses.map(b => (
                                    <tr key={b.id}>
                                        <td>{new Date(b.created_at).toLocaleString('it-IT')}</td>
                                        <td>
                                            <span className="team-color-dot" style={{ background: b.team_color }}></span>
                                            {b.team_name}
                                        </td>
                                        <td style={{ textAlign: 'center', color: b.points > 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 'bold' }}>
                                            {b.points > 0 ? `+${b.points}` : b.points}
                                        </td>
                                        <td>{b.reason}</td>
                                        <td style={{ textAlign: 'center' }}>{b.day}</td>
                                        <td>{b.created_by_name}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
