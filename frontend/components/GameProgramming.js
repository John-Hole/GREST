'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AutocompleteInput from './AutocompleteInput';
import '../styles/modal.css';

export default function GameProgramming() {
    const [selectedDay, setSelectedDay] = useState(null);
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);

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

    const [editingSlot, setEditingSlot] = useState(null); // { period, index, data }
    const [locations, setLocations] = useState([]);
    const [referees, setReferees] = useState([]);

    // State for "save new to DB?" confirmation dialog
    const [pendingSaveConfirm, setPendingSaveConfirm] = useState(null);
    // { newLocations: [], newReferees: [], onConfirm, onSkip }

    useEffect(() => {
        const d = Array.from({ length: 15 }, (_, i) => i + 1);
        setDays(d);
        
        const fetchInitialDay = async () => {
            try {
                const res = await fetch('/api/config/current-day');
                const data = await res.json();
                // This will trigger the selectedDay useEffect which loads data
                setSelectedDay(data.day || 1);
            } catch (err) {
                console.error('Error fetching current day', err);
                setSelectedDay(1); // fallback
            }
        };

        fetchInitialDay();
        fetchLocations();
        fetchReferees();
    }, []);

    useEffect(() => {
        if (selectedDay !== null) {
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

            // Group matches by timeSlot
            const grouped = {};
            matches.forEach(m => {
                if (!grouped[m.timeSlot]) grouped[m.timeSlot] = [];
                grouped[m.timeSlot].push(m);
            });

            // Sort each slot's matches by id so field index is stable
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

            const slotsMorning = ['11:00', '11:30', '12:00'];
            const slotsAfternoon = ['15:00', '15:30', '16:00'];

            // Read field data from ANY morning time slot that has data.
            // Each field index (0,1,2) maps to one UI postazione.
            // We scan all time slots but only set the postazione if not yet filled.
            for (const ts of slotsMorning) {
                if (grouped[ts]) {
                    grouped[ts].forEach((match, idx) => {
                        if (idx < 3 && !newMorning[idx].gameName && match.gameName) {
                            newMorning[idx] = {
                                slot: idx + 1,
                                gameName: match.gameName,
                                location: match.location || '',
                                referee: match.referee || ''
                            };
                        }
                    });
                }
            }

            for (const ts of slotsAfternoon) {
                if (grouped[ts]) {
                    grouped[ts].forEach((match, idx) => {
                        if (idx < 3 && !newAfternoon[idx].gameName && match.gameName) {
                            newAfternoon[idx] = {
                                slot: idx + 4,
                                gameName: match.gameName,
                                location: match.location || '',
                                referee: match.referee || ''
                            };
                        }
                    });
                }
            }

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

    const openModal = (period, index) => {
        const data = period === 'morning' ? morningGames[index] : afternoonGames[index];
        setEditingSlot({ period, index, data: { ...data } });
    };

    const closeModal = () => {
        setEditingSlot(null);
    };

    const handleModalChange = (field, value) => {
        setEditingSlot(prev => ({
            ...prev,
            data: { ...prev.data, [field]: value }
        }));
    };

    const saveModalChanges = () => {
        if (!editingSlot) return;
        const { period, index, data } = editingSlot;

        // Update all fields in a single setState to avoid stale closure bug.
        // Calling handleGameChange 3 times reads the same stale state snapshot,
        // so only the last field would survive.
        if (period === 'morning') {
            setMorningGames(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    gameName: data.gameName,
                    location: data.location,
                    referee: data.referee
                };
                return updated;
            });
        } else {
            setAfternoonGames(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    gameName: data.gameName,
                    location: data.location,
                    referee: data.referee
                };
                return updated;
            });
        }
        closeModal();
    };

    // --- DB lookup logic: find new locations/referees not in DB ---
    const findNewEntries = () => {
        const allGames = [...morningGames, ...afternoonGames];
        const locationNames = Array.isArray(locations) ? locations.map(l => l.name.toLowerCase()) : [];
        const refereeNames = Array.isArray(referees) ? referees.map(r => r.name.toLowerCase()) : [];

        const newLocations = new Set();
        const newReferees = new Set();

        allGames.forEach(g => {
            if (g.location && g.location.trim() && !locationNames.includes(g.location.trim().toLowerCase())) {
                newLocations.add(g.location.trim());
            }
            if (g.referee && g.referee.trim() && !refereeNames.includes(g.referee.trim().toLowerCase())) {
                newReferees.add(g.referee.trim());
            }
        });

        return {
            newLocations: [...newLocations],
            newReferees: [...newReferees]
        };
    };

    const saveNewEntriesToDb = async (newLocs, newRefs) => {
        // Save new locations
        for (const name of newLocs) {
            try {
                await fetch('/api/locations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
            } catch (err) {
                console.error('Error saving location:', name, err);
            }
        }

        // Save new referees
        for (const name of newRefs) {
            try {
                await fetch('/api/referees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
            } catch (err) {
                console.error('Error saving referee:', name, err);
            }
        }

        // Refresh lists
        await fetchLocations();
        await fetchReferees();
    };

    const doSave = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/matches?day=${selectedDay}`);
            const matches = await res.json();

            // Group matches by timeSlot, sort by id for stable field index
            const grouped = {};
            matches.forEach(m => {
                if (!grouped[m.timeSlot]) grouped[m.timeSlot] = [];
                grouped[m.timeSlot].push(m);
            });
            Object.keys(grouped).forEach(ts => grouped[ts].sort((a, b) => a.id - b.id));

            const updates = [];

            // Helper: convert empty string to null so SQL COALESCE doesn't overwrite with ""
            const valOrNull = (v) => (v && v.trim()) ? v.trim() : null;

            // For each morning time slot, apply the field-based UI values.
            // Field index idx (0,1,2) within each time slot maps to morningGames[idx].
            ['11:00', '11:30', '12:00'].forEach(ts => {
                if (grouped[ts]) {
                    grouped[ts].forEach((match, idx) => {
                        if (idx < 3) {
                            updates.push({
                                id: match.id,
                                game_name: valOrNull(morningGames[idx].gameName),
                                location: valOrNull(morningGames[idx].location),
                                referee: valOrNull(morningGames[idx].referee)
                            });
                        }
                    });
                }
            });

            // Same for afternoon
            ['15:00', '15:30', '16:00'].forEach(ts => {
                if (grouped[ts]) {
                    grouped[ts].forEach((match, idx) => {
                        if (idx < 3) {
                            updates.push({
                                id: match.id,
                                game_name: valOrNull(afternoonGames[idx].gameName),
                                location: valOrNull(afternoonGames[idx].location),
                                referee: valOrNull(afternoonGames[idx].referee)
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

    const handleSave = async () => {
        // Check for new locations/referees before saving
        const { newLocations: newLocs, newReferees: newRefs } = findNewEntries();

        if (newLocs.length > 0 || newRefs.length > 0) {
            // Show confirmation dialog
            setPendingSaveConfirm({
                newLocations: newLocs,
                newReferees: newRefs,
                onConfirm: async () => {
                    setPendingSaveConfirm(null);
                    await saveNewEntriesToDb(newLocs, newRefs);
                    await doSave();
                },
                onSkip: async () => {
                    setPendingSaveConfirm(null);
                    await doSave();
                }
            });
        } else {
            await doSave();
        }
    };

    const renderGameCard = (game, period, index) => (
        <div 
            key={`${period}-${index}`} 
            className="game-card card prog-card clickable-card"
            onClick={() => openModal(period, index)}
            style={{ 
                cursor: 'pointer', 
                border: '1px solid var(--color-border)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                padding: 'var(--spacing-sm)'
            }}
        >
            <div className="prog-header" style={{ marginBottom: '0.4rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.3rem', fontSize: '0.85em', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                Postazione {index + 1} {period === 'morning' ? 'mattina' : 'pomeriggio'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1em', color: game.gameName ? 'var(--color-text-dark)' : 'var(--color-text-light)' }}>
                    {game.gameName || 'Da definire'}
                </div>
                
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    {game.location && (
                        <span className="badge badge-info" style={{ fontSize: '0.7em', padding: '1px 6px' }}>
                            📍 {game.location}
                        </span>
                    )}
                    {game.referee && (
                        <span className="badge badge-secondary" style={{ fontSize: '0.7em', padding: '1px 6px' }}>
                            👤 {game.referee}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.2, fontSize: '0.8em' }}>
                ✏️
            </div>
        </div>
    );

    return (
        <>
        <div className="game-programming card animate-fade-in" style={{ padding: 'var(--spacing-md)' }}>
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.6rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <span>🎮</span> Programmazione Giochi
                </h1>
            </div>

            {loading ? (
                <div className="spinner-container" style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
            ) : (
                <>
                    <div style={{ marginBottom: '1.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 'bold', fontSize: '0.9em' }}>Giorno:</label>
                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(Number(e.target.value))}
                                className="input-field"
                                style={{ maxWidth: '110px', padding: '4px 8px', fontSize: '0.9em' }}
                            >
                                {days.map(d => (
                                    <option key={d} value={d}>Giorno {d}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleSave}
                            disabled={loading}
                            style={{ marginLeft: 'auto', padding: '6px 14px' }}
                        >
                            {loading ? 'Salvataggio...' : '💾 Salva Tutto'}
                        </button>
                    </div>

                    {msg && (
                        <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem', padding: '0.6rem', fontSize: '0.85em' }}>
                            {msg.text}
                        </div>
                    )}

                    {/* Morning Section */}
                    <div className="period-section" style={{ marginBottom: '1.5rem' }}>
                        <div className="period-header" style={{
                            backgroundColor: 'var(--color-bg-navbar)',
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            marginBottom: '0.8rem',
                            fontSize: '0.95em',
                            fontWeight: 'bold',
                            border: '1px solid var(--color-secondary-light)',
                            color: 'var(--color-primary-dark)'
                        }}>
                            <span>🌅</span> Mattina (11:00 - 12:30)
                        </div>
                        <div className="grid-3" style={{ gap: '0.6rem' }}>
                            {morningGames.map((game, idx) => renderGameCard(game, 'morning', idx))}
                        </div>
                    </div>

                    {/* Afternoon Section */}
                    <div className="period-section">
                        <div className="period-header" style={{
                            backgroundColor: 'var(--color-bg-navbar)',
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            marginBottom: '0.8rem',
                            fontSize: '0.95em',
                            fontWeight: 'bold',
                            border: '1px solid var(--color-secondary-light)',
                            color: 'var(--color-primary-dark)'
                        }}>
                            <span>☀️</span> Pomeriggio (15:00 - 16:30)
                        </div>
                        <div className="grid-3" style={{ gap: '0.6rem' }}>
                            {afternoonGames.map((game, idx) => renderGameCard(game, 'afternoon', idx))}
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* Slot Edit Modal — portaled to body so overlay covers full screen */}
        {editingSlot && createPortal(
            <div className="modal-overlay" onClick={closeModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', padding: 'var(--spacing-md)' }}>
                    <h3 className="modal-title" style={{ marginBottom: '1rem', fontSize: '1.2em' }}>
                        Modifica Postazione {editingSlot.index + 1}
                    </h3>
                    
                    <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                        <label className="prog-label" style={{ fontSize: '0.85em', marginBottom: '0.2rem' }}>Nome Gioco</label>
                        <input
                            type="text"
                            className="input-field"
                            value={editingSlot.data.gameName || ''}
                            onChange={(e) => handleModalChange('gameName', e.target.value)}
                            placeholder="Es. Palla Prigioniera"
                            autoFocus
                            style={{ width: '100%', padding: '6px 10px' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                        <label className="prog-label" style={{ fontSize: '0.85em', marginBottom: '0.2rem' }}>Luogo</label>
                        <AutocompleteInput
                            value={editingSlot.data.location || ''}
                            onChange={(e) => handleModalChange('location', e.target.value)}
                            suggestions={Array.isArray(locations) ? locations.map(loc => loc.name) : []}
                            placeholder="Es. Campo 1"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label className="prog-label" style={{ fontSize: '0.85em', marginBottom: '0.2rem' }}>Nome Arbitro</label>
                        <AutocompleteInput
                            value={editingSlot.data.referee || ''}
                            onChange={(e) => handleModalChange('referee', e.target.value)}
                            suggestions={Array.isArray(referees) ? referees.map(ref => ref.name) : []}
                            placeholder="Es. Mario Rossi"
                        />
                    </div>

                    <div className="modal-actions" style={{ display: 'flex', gap: '0.6rem' }}>
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={closeModal}>
                            Annulla
                        </button>
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={saveModalChanges}>
                            Applica
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Confirmation dialog — portaled to body */}
        {pendingSaveConfirm && createPortal(
            <div className="modal-overlay" onClick={() => setPendingSaveConfirm(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: 'var(--spacing-md)' }}>
                    <h3 className="modal-title" style={{ marginBottom: '0.8rem', fontSize: '1.2em' }}>
                        Nuove voci trovate
                    </h3>
                    
                    <p style={{ fontSize: '0.9em', color: 'var(--color-text-medium)', marginBottom: '1rem', textAlign: 'center' }}>
                        Hai inserito nomi non presenti nel database. Vuoi salvarli per il futuro?
                    </p>

                    {pendingSaveConfirm.newLocations.length > 0 && (
                        <div style={{ marginBottom: '0.8rem' }}>
                            <div style={{ fontSize: '0.85em', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.3rem' }}>
                                📍 Nuovi Luoghi:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {pendingSaveConfirm.newLocations.map((loc, i) => (
                                    <span key={i} className="badge badge-info" style={{ fontSize: '0.8em' }}>{loc}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {pendingSaveConfirm.newReferees.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.85em', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.3rem' }}>
                                👤 Nuovi Arbitri:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {pendingSaveConfirm.newReferees.map((ref, i) => (
                                    <span key={i} className="badge badge-secondary" style={{ fontSize: '0.8em' }}>{ref}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="modal-actions" style={{ display: 'flex', gap: '0.6rem' }}>
                        <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ flex: 1 }} 
                            onClick={pendingSaveConfirm.onSkip}
                        >
                            No, salva solo giochi
                        </button>
                        <button 
                            className="btn btn-primary btn-sm" 
                            style={{ flex: 1 }} 
                            onClick={pendingSaveConfirm.onConfirm}
                        >
                            Sì, salva nel DB
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        </>
    );
}
