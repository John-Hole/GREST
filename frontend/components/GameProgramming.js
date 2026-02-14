'use client';

import { useState, useEffect } from 'react';

export default function GameProgramming() {
    const [selectedDay, setSelectedDay] = useState(1);
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // Morning slots (11:00 - 12:30): 3 games
    const [morningGames, setMorningGames] = useState([
        { slot: 1, gameName: '', location: '', referee: '' },
        { slot: 2, gameName: '', location: '', referee: '' },
        { slot: 3, gameName: '', location: '', referee: '' }
    ]);

    // Afternoon slots (15:00 - 16:30): 3 games
    const [afternoonGames, setAfternoonGames] = useState([
        { slot: 4, gameName: '', location: '', referee: '' },
        { slot: 5, gameName: '', location: '', referee: '' },
        { slot: 6, gameName: '', location: '', referee: '' }
    ]);

    const [locations, setLocations] = useState([]);

    useEffect(() => {
        // Generate days 1-15
        const d = Array.from({ length: 15 }, (_, i) => i + 1);
        setDays(d);
        fetchLocations();
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

    const loadDayData = async (day) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/matches?day=${day}`);
            const matches = await res.json();

            // Map matches to game slots based on timeSlot
            const timeSlotMapping = {
                '11:00': 1,
                '11:30': 2,
                '12:00': 3,
                '15:00': 4,
                '15:30': 5,
                '16:00': 6
            };

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

            matches.forEach(match => {
                const slotNum = timeSlotMapping[match.timeSlot];
                if (slotNum) {
                    const gameData = {
                        slot: slotNum,
                        gameName: match.gameName || '',
                        location: match.location || '',
                        referee: match.referee || ''
                    };

                    if (slotNum <= 3) {
                        newMorning[slotNum - 1] = gameData;
                    } else {
                        newAfternoon[slotNum - 4] = gameData;
                    }
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

    const handleGameChange = (period, slotIndex, field, value) => {
        if (period === 'morning') {
            const updated = [...morningGames];
            updated[slotIndex][field] = value;
            setMorningGames(updated);
        } else {
            const updated = [...afternoonGames];
            updated[slotIndex][field] = value;
            setAfternoonGames(updated);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setMsg(null);
        try {
            // Prepare payload to update all matches for this day
            const res = await fetch(`/api/matches?day=${selectedDay}`);
            const matches = await res.json();

            const timeSlotMapping = {
                1: '11:00',
                2: '11:30',
                3: '12:00',
                4: '15:00',
                5: '15:30',
                6: '16:00'
            };

            const allGames = [...morningGames, ...afternoonGames];
            const updates = [];

            allGames.forEach(game => {
                const timeSlot = timeSlotMapping[game.slot];
                const matchesInSlot = matches.filter(m => m.timeSlot === timeSlot);

                matchesInSlot.forEach(match => {
                    updates.push({
                        id: match.id,
                        game_name: game.gameName,
                        location: game.location,
                        referee: game.referee
                    });
                });
            });

            const updateRes = await fetch('/api/matches/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (updateRes.ok) {
                setMsg({ type: 'success', text: 'Programmazione salvata!' });
            } else {
                setMsg({ type: 'error', text: 'Errore nel salvataggio.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        } finally {
            setLoading(false);
        }
    };

    const renderGameCard = (game, period, index) => (
        <div key={`${period}-${index}`} className="game-card card" style={{ padding: '1.5rem' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9em', color: 'var(--color-primary-medium)', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                Turno {index + 1} {period === 'morning' ? 'mattina' : 'pomeriggio'}
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.9em', color: 'var(--color-text-medium)', marginBottom: '0.3rem', display: 'block' }}>
                    Nome Gioco
                </label>
                <input
                    type="text"
                    className="input-field"
                    value={game.gameName}
                    onChange={(e) => handleGameChange(period, index, 'gameName', e.target.value)}
                    placeholder="Es. Calcio, Basket..."
                    style={{ width: '100%', fontSize: '1.1em', fontWeight: '600', color: 'var(--color-primary-medium)' }}
                />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.9em', color: 'var(--color-text-medium)', marginBottom: '0.3rem', display: 'block' }}>
                    Campo
                </label>
                <select
                    className="input-field"
                    value={game.location}
                    onChange={(e) => handleGameChange(period, index, 'location', e.target.value)}
                    style={{ width: '100%' }}
                >
                    <option value="">-- Seleziona Campo --</option>
                    {locations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label style={{ fontSize: '0.9em', color: 'var(--color-text-medium)', marginBottom: '0.3rem', display: 'block' }}>
                    Nome Arbitro
                </label>
                <input
                    type="text"
                    className="input-field"
                    value={game.referee}
                    onChange={(e) => handleGameChange(period, index, 'referee', e.target.value)}
                    placeholder="Nome arbitro"
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );

    return (
        <div className="game-programming card animate-fade-in">
            <h2 className="section-title">Programmazione Giochi</h2>

            <div className="mb-8 flex gap-4 items-center" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
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
                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {afternoonGames.map((game, idx) => renderGameCard(game, 'afternoon', idx))}
                </div>
            </div>
        </div>
    );
}
