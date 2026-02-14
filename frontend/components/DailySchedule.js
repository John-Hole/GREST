
'use client';

import { useState, useEffect } from 'react';

export default function DailySchedule() {
    const [days, setDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(1);
    const [matches, setMatches] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // Initial load: fetch days and locations
    useEffect(() => {
        // Fetch locations: 
        fetchLocations();

        // Generate days 1-15 (or fetch from config if API exists, but static is fine)
        const d = Array.from({ length: 15 }, (_, i) => i + 1);
        setDays(d);
    }, []);

    // Fetch matches when day changes
    useEffect(() => {
        fetchMatches(selectedDay);
    }, [selectedDay]);

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/locations');
            const data = await res.json();
            setLocations(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMatches = async (day) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/matches?day=${day}`);
            const data = await res.json();
            setMatches(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMatchChange = (matchId, field, value) => {
        setMatches(matches.map(m =>
            m.id === matchId ? { ...m, [field]: value } : m
        ));
    };

    const handleSave = async () => {
        setLoading(true);
        setMsg(null);
        try {
            // Prepare payload: only changed fields or all?
            // The API supports bulk update via array
            const payload = matches.map(m => ({
                id: m.id,
                location: m.location,
                referee: m.referee,
                game_name: m.gameName
            }));

            // Since api/matches/route.js might return mapped keys like teamHome, I need to make sure I send back what the PUT expects.
            // The GET returns: { id, day, timeSlot, location, status, scoreHome, scoreAway, refereeNotes, teamHome, teamAway }
            // It does NOT currently return 'referee' and 'gameName'. I need to update GET /api/matches to return them first!

            const res = await fetch('/api/matches/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMsg({ type: 'success', text: 'Programmazione salvata!' });
                fetchMatches(selectedDay); // Refresh
            } else {
                setMsg({ type: 'error', text: 'Errore nel salvataggio.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade-in">
            <h2 className="section-title">Programmazione Giornaliera</h2>

            <div className="mb-4 p-4 border rounded" style={{ borderColor: 'var(--color-border)', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1em', marginBottom: '1rem' }}>Gestione Luoghi (Tag)</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Nuovo Luogo (es. Palestra)"
                        id="newLocationInput"
                        className="input-field"
                        style={{ maxWidth: '300px' }}
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={async () => {
                            const input = document.getElementById('newLocationInput');
                            const val = input.value.trim();
                            if (!val) return;
                            try {
                                const res = await fetch('/api/locations', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name: val })
                                });
                                if (res.ok) {
                                    input.value = '';
                                    fetchLocations();
                                    setMsg({ type: 'success', text: 'Luogo aggiunto!' });
                                } else {
                                    setMsg({ type: 'error', text: 'Errore aggiunta luogo.' });
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                    >
                        ➕ Aggiungi
                    </button>
                </div>
            </div>

            <div className="mb-8 flex gap-4 items-center" style={{ marginBottom: '2rem' }}>
                <label style={{ fontWeight: 'bold' }}>Seleziona Giornata:</label>
                <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="input-field"
                    style={{ maxWidth: '200px' }}
                >
                    {days.map(d => (
                        <option key={d} value={d}>Giorno {d} (15 Giugno + {d - 1})</option>
                    ))}
                </select>
                <button className="btn btn-primary ml-auto" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : '💾 Salva Tutti'}
                </button>
            </div>

            {msg && (
                <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem' }}>
                    {msg.text}
                </div>
            )}

            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {matches.map(m => (
                    <div key={m.id} className="card" style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', pb: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1em', color: 'var(--color-primary-medium)' }}>
                                {(() => {
                                    const idx = ['11:00', '11:30', '12:00', '15:00', '15:30', '16:00'].indexOf(m.timeSlot);
                                    if (idx < 3) return `Turno ${idx + 1} mattina`;
                                    return `Turno ${idx - 2} pomeriggio`;
                                })()}
                            </span>
                            <span style={{ fontSize: '0.8em', color: 'var(--color-text-medium)' }}>
                                ID: #{m.id}
                            </span>
                        </div>

                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontWeight: '500' }}>
                            <div style={{ textAlign: 'right', flex: 1 }}>{m.teamHome.name}</div>
                            <div style={{ color: 'var(--color-text-medium)' }}>VS</div>
                            <div style={{ textAlign: 'left', flex: 1 }}>{m.teamAway.name}</div>
                        </div>

                        <div className="form-grid" style={{ display: 'grid', gap: '0.8rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85em', color: 'var(--color-text-medium)', marginBottom: '0.2rem', display: 'block' }}>Luogo (Tag)</label>
                                <select
                                    value={m.location || ''}
                                    onChange={(e) => handleMatchChange(m.id, 'location', e.target.value)}
                                    className="input-field"
                                    style={{ width: '100%', padding: '0.4rem' }}
                                >
                                    <option value="">-- Seleziona Luogo --</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '0.85em', color: 'var(--color-text-medium)', marginBottom: '0.2rem', display: 'block' }}>Arbitro</label>
                                <input
                                    type="text"
                                    value={m.referee || ''}
                                    onChange={(e) => handleMatchChange(m.id, 'referee', e.target.value)}
                                    className="input-field"
                                    placeholder="Nome dell'arbitro"
                                    style={{ width: '100%', padding: '0.4rem' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '0.85em', color: 'var(--color-text-medium)', marginBottom: '0.2rem', display: 'block' }}>Gioco</label>
                                <input
                                    type="text"
                                    value={m.gameName || ''}
                                    onChange={(e) => handleMatchChange(m.id, 'gameName', e.target.value)}
                                    className="input-field"
                                    placeholder="Es. Ruba bandiera, Calcio..."
                                    style={{ width: '100%', padding: '0.4rem' }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
