'use client';

import { useState, useEffect } from 'react';
import AutocompleteInput from './AutocompleteInput';


export default function GameProgramming() {
    const [selectedDay, setSelectedDay] = useState(1);
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [showTimes, setShowTimes] = useState(true);

    useEffect(() => {
        const check = () => {
            const val = localStorage.getItem('showTurnTimes');
            setShowTimes(val !== 'false');
        };
        check();
        window.addEventListener('storage', check);
        return () => window.removeEventListener('storage', check);
    }, []);

    const toggleShowTimes = (val) => {
        setShowTimes(val);
        localStorage.setItem('showTurnTimes', val);
        window.dispatchEvent(new Event('storage'));
    };

    const getTimeLabel = (period, index) => {
        // Rimosso per richiesta utente: qui si configurano postazioni, non orari
        return '';
    };

    // We go back to 3 positions per period as requested, but with better mapping
    const [morningGames, setMorningGames] = useState([
        { slot: 1, gameName: '', location: '', referee: '' },
        { slot: 2, gameName: '', location: '', referee: '' },
        { slot: 3, gameName: '', location: '', referee: '' }
    ]);

    const [afternoonGames, setAfternoonGames] = useState([
        { slot: 4, gameName: '', location: '', referee: '' },
        { slot: 5, gameName: '', location: '', referee: '' },
        { slot: 6, gameName: '', location: '', referee: '' }
    ]);

    const [locations, setLocations] = useState([]);
    const [referees, setReferees] = useState([]);


    useEffect(() => {
        // Generate days 1-15
        const d = Array.from({ length: 15 }, (_, i) => i + 1);
        setDays(d);
        fetchLocations();
        fetchReferees();
    }, []);

    useEffect(() => {
        if (selectedDay) {
            loadDayData(selectedDay);
        }
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

    const fetchReferees = async () => {
        try {
            const res = await fetch('/api/referees');
            const data = await res.json();
            setReferees(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadDayData = async (day) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/matches?day=${day}`);
            const matches = await res.json();

            // Group by timeSlot to find the "N-th" match of each slot
            const grouped = {};
            matches.forEach(m => {
                if (!grouped[m.timeSlot]) grouped[m.timeSlot] = [];
                grouped[m.timeSlot].push(m);
            });

            // Sort each group by ID to have stable order (Postazione 1, 2, 3)
            Object.keys(grouped).forEach(ts => {
                grouped[ts].sort((a, b) => a.id - b.id);
            });

            const newMorning = [
                { slot: 1, gameName: '', location: '', referee: '' },
                { slot: 2, gameName: '', location: '', referee: '' },
                { slot: 3, gameName: '', location: '', referee: '' }
            ];

            const newAfternoon = [
                { slot: 4, gameName: '', location: '', referee: '' },
                { slot: 5, gameName: '', location: '', referee: '' },
                { slot: 6, gameName: '', location: '', referee: '' }
            ];

            // For each period, find the data from the first available slot that has it
            const slotsMorning = ['11:00', '11:30', '12:00'];
            const slotsAfternoon = ['15:00', '15:30', '16:00'];

            slotsMorning.forEach((ts) => {
                if (grouped[ts]) {
                    grouped[ts].forEach((match, idx) => {
                        if (idx < 3 && match.gameName) {
                            newMorning[idx] = {
                                slot: idx + 1,
                                gameName: match.gameName,
                                location: match.location,
                                referee: match.referee
                            };
                        }
                    });
                }
            });

            slotsAfternoon.forEach((ts) => {
                if (grouped[ts]) {
                    grouped[ts].forEach((match, idx) => {
                        if (idx < 3 && match.gameName) {
                            newAfternoon[idx] = {
                                slot: idx + 4,
                                gameName: match.gameName,
                                location: match.location,
                                referee: match.referee
                            };
                        }
                    });
                }
            });

            setMorningGames(newMorning);
            setAfternoonGames(newAfternoon);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGameChange = (period, index, field, value) => {
        if (period === 'morning') {
            const updated = [...morningGames];
            updated[index] = { ...updated[index], [field]: value };
            setMorningGames(updated);
        } else {
            const updated = [...afternoonGames];
            updated[index] = { ...updated[index], [field]: value };
            setAfternoonGames(updated);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setMsg(null);
        try {
            // Fetch current matches to apply mapping
            const res = await fetch(`/api/matches?day=${selectedDay}`);
            const matches = await res.json();

            // Group by timeSlot
            const grouped = {};
            matches.forEach(m => {
                if (!grouped[m.timeSlot]) grouped[m.timeSlot] = [];
                grouped[m.timeSlot].push(m);
            });
            Object.keys(grouped).forEach(ts => grouped[ts].sort((a, b) => a.id - b.id));

            const updates = [];

            // Morning mapping
            ['11:00', '11:30', '12:00'].forEach(ts => {
                if (grouped[ts]) {
                    grouped[ts].forEach((match, idx) => {
                        if (idx < 3) {
                            updates.push({
                                id: match.id,
                                game_name: morningGames[idx].gameName,
                                location: morningGames[idx].location,
                                referee: morningGames[idx].referee
                            });
                        }
                    });
                }
            });

            // Afternoon mapping
            ['15:00', '15:30', '16:00'].forEach(ts => {
                if (grouped[ts]) {
                    grouped[ts].forEach((match, idx) => {
                        if (idx < 3) {
                            updates.push({
                                id: match.id,
                                game_name: afternoonGames[idx].gameName,
                                location: afternoonGames[idx].location,
                                referee: afternoonGames[idx].referee
                            });
                        }
                    });
                }
            });

            const updateRes = await fetch('/api/matches/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!updateRes.ok) {
                setMsg({ type: 'error', text: 'Errore nel salvataggio.' });
            } else {
                setMsg({ type: 'success', text: 'Programmazione salvata!' });
                loadDayData(selectedDay);
            }
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        } finally {
            setLoading(false);
        }
    };



    const renderGameCard = (game, period, index) => (
        <div key={`${period}-${index}`} className="game-card card prog-card">
            <div className="prog-header">
                Postazione {index + 1} {period === 'morning' ? 'mattina' : 'pomeriggio'}
            </div>

            <div className="form-group prog-form-group">
                <label className="prog-label">
                    Nome Gioco
                </label>
                <input
                    type="text"
                    className="input-field prog-input"
                    value={game.gameName || ''}
                    onChange={(e) => handleGameChange(period, index, 'gameName', e.target.value)}
                    placeholder="Es. Palla Prigioniera"
                />
            </div>

            <div className="prog-compact-row">
                <div className="form-group prog-form-group">
                    <label className="prog-label">
                        Luogo
                    </label>
                    <AutocompleteInput
                        value={game.location || ''}
                        onChange={(e) => handleGameChange(period, index, 'location', e.target.value)}
                        suggestions={Array.isArray(locations) ? locations.map(loc => loc.name) : []}
                        placeholder="Es. Campo 1"
                        className="input-field prog-input"
                    />
                </div>

                <div className="form-group prog-form-group">
                    <label className="prog-label">
                        Nome Arbitro
                    </label>
                    <AutocompleteInput
                        value={game.referee || ''}
                        onChange={(e) => handleGameChange(period, index, 'referee', e.target.value)}
                        suggestions={Array.isArray(referees) ? referees.map(ref => ref.name) : []}
                        placeholder="Es. Mario Rossi"
                        className="input-field prog-input"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="game-programming card animate-fade-in">
            {/* Header / Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🎮</span> Programmazione Giochi
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-bg-card)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                        <input
                            type="checkbox"
                            checked={showTimes}
                            onChange={(e) => toggleShowTimes(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className="slider" style={{
                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: showTimes ? 'var(--color-primary)' : '#ccc',
                            transition: '.4s', borderRadius: '34px'
                        }}>
                            <span style={{
                                position: 'absolute', content: '""', height: '16px', width: '16px',
                                left: '4px', bottom: '4px', backgroundColor: 'white',
                                transition: '.4s', borderRadius: '50%',
                                transform: showTimes ? 'translateX(16px)' : 'translateX(0)'
                            }}></span>
                        </span>
                    </label>
                    <span style={{ fontSize: '0.9em', fontWeight: '500' }}>Mostra orari (Pubblico)</span>
                </div>
            </div>

            {loading ? (
                <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>
            ) : (
                <>
                    <div className="mb-8 flex gap-4 items-center" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ fontWeight: 'bold' }}>Seleziona Giornata:</label>
                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(Number(e.target.value))}
                            className="input-field"
                            style={{ maxWidth: '200px' }}
                        >
                            {days.map(d => (
                                <option key={d} value={d}>Giorno {d}</option>
                            ))}
                        </select>

                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={loading}
                            style={{ marginLeft: 'auto' }}
                        >
                            {loading ? 'Salvataggio...' : '💾 Salva Programmazione'}
                        </button>
                    </div>



                    {msg && (
                        <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem' }}>
                            {msg.text}
                        </div>
                    )}

                    {/* Morning Section */}
                    <div className="period-section" style={{ marginBottom: '3rem' }}>
                        <div className="period-header" style={{
                            backgroundColor: 'var(--color-secondary-light)',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            fontSize: '1.2em',
                            fontWeight: 'bold'
                        }}>
                            <span>🌅</span> Giorno {selectedDay} - Mattina (11:00 - 12:30)
                        </div>
                        <div className="grid-3" style={{ gap: '1.5rem' }}>
                            {morningGames.map((game, idx) => renderGameCard(game, 'morning', idx))}
                        </div>
                    </div>

                    {/* Afternoon Section */}
                    <div className="period-section">
                        <div className="period-header" style={{
                            backgroundColor: 'var(--color-secondary-light)',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            fontSize: '1.2em',
                            fontWeight: 'bold'
                        }}>
                            <span>☀️</span> Giorno {selectedDay} - Pomeriggio (15:00 - 16:30)
                        </div>
                        <div className="grid-3" style={{ gap: '1.5rem' }}>
                            {afternoonGames.map((game, idx) => renderGameCard(game, 'afternoon', idx))}
                        </div>
                    </div>
                </>
            )}
        </div>

    );
}
