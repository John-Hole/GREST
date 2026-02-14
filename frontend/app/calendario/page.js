'use client';

import { useState, useEffect } from 'react';
import MatchCard from '@/components/MatchCard';
import MatchEditModal from '@/components/MatchEditModal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import html2canvas from 'html2canvas';

const MORNING_SLOTS = ['11:00', '11:30', '12:00'];
const AFTERNOON_SLOTS = ['15:00', '15:30', '16:00'];

export default function CalendarPage() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(1);
    const [tournamentDays, setTournamentDays] = useState(Array.from({ length: 15 }, (_, i) => i + 1));

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchMatches();
        // Also fetch config dates to populate dropdown properly?
        // For now we assume 1-5 days as per spec "5 configurazioni date"
    }, [selectedDay]);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/matches?day=${selectedDay}`);
            const data = await res.json();
            setMatches(data);
        } catch (err) {
            console.error('Error fetching matches', err);
            showToast({ type: 'error', message: 'Errore caricamento partite' });
        } finally {
            setLoading(false);
        }
    };

    const handleMatchClick = (match) => {
        setEditingMatch(match);
        setIsModalOpen(true);
    };

    const handleSaveResult = async (resultData) => {
        if (!editingMatch) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/matches/${editingMatch.id}/result`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resultData),
            });

            const data = await res.json();

            if (res.ok) {
                showToast({ type: 'success', message: 'Risultato salvato!' });
                setIsModalOpen(false);
                setEditingMatch(null);
                // Optimistic update or refresh
                fetchMatches();
            } else {
                showToast({ type: 'error', message: data.message || 'Errore salvataggio' });
            }
        } catch (err) {
            console.error('Save error', err);
            showToast({ type: 'error', message: 'Errore di connessione' });
        } finally {
            setIsSaving(false);
        }
    };
    const handleExport = async () => {
        setIsExporting(true);
        // Small delay to ensure render updates if needed
        setTimeout(async () => {
            try {
                const element = document.getElementById('calendar-export-container');
                if (!element) return;

                const canvas = await html2canvas(element, {
                    scale: 2, // Higher resolution
                    backgroundColor: '#ffffff',
                    useCORS: true // Handle external potential images
                });

                const link = document.createElement('a');
                link.download = `programma-giorno-${selectedDay}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                showToast({ type: 'success', message: 'Programma esportato con successo!' });
            } catch (err) {
                console.error('Export error:', err);
                showToast({ type: 'error', message: 'Errore generico durante l\'esportazione.' });
            } finally {
                setIsExporting(false);
            }
        }, 100);
    };

    const canEdit = user && (user.role === 'admin' || user.role === 'operator');

    const getMatchesForSlot = (timeSlot) => {
        return matches.filter(m => m.timeSlot === timeSlot);
    };

    if (loading && matches.length === 0) {
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="calendar-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Calendario Partite</h1>
                <button
                    className="btn btn-secondary"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? 'Esportazione...' : '🖼️ Esporta PNG'}
                </button>
            </div>

            <div className="tabs">
                {tournamentDays.map(day => (
                    <button
                        key={day}
                        className={`tab ${selectedDay === day ? 'active' : ''}`}
                        onClick={() => setSelectedDay(day)}
                    >
                        Giorno {day}
                    </button>
                ))}
                {/* Mobile: maybe use select if too many tabs? CSS overflow handles tabs usually */}
            </div>

            <div className="calendar-content animate-fade-in">
                <h2 className="period-header">Mattina</h2>
                {MORNING_SLOTS.map(slot => {
                    const slotMatches = getMatchesForSlot(slot);
                    if (slotMatches.length === 0) return null;

                    return (
                        <div key={slot} className="time-slot-section">
                            <div className="time-slot-header">Turno {MORNING_SLOTS.indexOf(slot) + 1} mattina</div>
                            <div className="grid-3 matches-grid">
                                {slotMatches.map(match => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        isAdminOrOperator={canEdit}
                                        onClick={handleMatchClick}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                <h2 className="period-header">Pomeriggio</h2>
                {AFTERNOON_SLOTS.map(slot => {
                    const slotMatches = getMatchesForSlot(slot);
                    if (slotMatches.length === 0) return null;

                    return (
                        <div key={slot} className="time-slot-section">
                            <div className="time-slot-header">Turno {AFTERNOON_SLOTS.indexOf(slot) + 1} pomeriggio</div>
                            <div className="grid-3 matches-grid">
                                {slotMatches.map(match => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        isAdminOrOperator={canEdit}
                                        onClick={handleMatchClick}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <MatchEditModal
                match={editingMatch}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveResult}
                isSaving={isSaving}
            />

            {/* Hidden Export Container */}
            <div
                id="calendar-export-container"
                style={{
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    width: '800px',
                    padding: '40px',
                    backgroundColor: 'white',
                    fontFamily: 'Inter, sans-serif',
                    color: '#1a1a2e',
                    overflow: 'hidden',
                    maxHeight: '0',
                    maxWidth: '0'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #ff9500', paddingBottom: '15px' }}>
                    <h1 style={{ margin: 0, color: '#ff9500', fontSize: '2.5rem' }}>Programma Giornata {selectedDay}</h1>
                    <p style={{ margin: '5px 0 0', color: '#666', fontSize: '1.2rem' }}>GREST 2025</p>
                </div>

                {/* Morning Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ background: '#f5f5f7', padding: '10px 15px', borderRadius: '8px', color: '#333', borderLeft: '5px solid #ff9500' }}>
                        Mattina (11:00 - 12:30)
                    </h2>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {MORNING_SLOTS.map((time, idx) => {
                            const matchesInSlot = matches.filter(m => m.timeSlot === time);
                            return matchesInSlot.length > 0 ? (
                                <div key={time} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', display: 'flex', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#ff9500', minWidth: '80px' }}>{time}</div>
                                    <div style={{ flex: 1 }}>
                                        {matchesInSlot.map(m => (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '5px', marginBottom: '5px' }}>
                                                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                                                    {m.gameName || 'Partita'} <span style={{ fontWeight: '400', color: '#666', fontSize: '0.9rem' }}>@ 📍 {m.location || 'Campo non assegnato'}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ color: m.teamHome.color, fontWeight: 'bold' }}>{m.teamHome.name}</span>
                                                    <span style={{ fontSize: '0.9rem', color: '#999' }}>vs</span>
                                                    <span style={{ color: m.teamAway.color, fontWeight: 'bold' }}>{m.teamAway.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {matchesInSlot[0]?.referee && (
                                            <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                                                👮 Arbitro: {matchesInSlot[0].referee}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>

                {/* Afternoon Section */}
                <div>
                    <h2 style={{ background: '#f5f5f7', padding: '10px 15px', borderRadius: '8px', color: '#333', borderLeft: '5px solid #007aff' }}>
                        Pomeriggio (15:00 - 16:30)
                    </h2>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {AFTERNOON_SLOTS.map((time, idx) => {
                            const matchesInSlot = matches.filter(m => m.timeSlot === time);
                            return matchesInSlot.length > 0 ? (
                                <div key={time} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', display: 'flex', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#007aff', minWidth: '80px' }}>{time}</div>
                                    <div style={{ flex: 1 }}>
                                        {matchesInSlot.map(m => (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '5px', marginBottom: '5px' }}>
                                                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                                                    {m.gameName || 'Partita'} <span style={{ fontWeight: '400', color: '#666', fontSize: '0.9rem' }}>@ 📍 {m.location || 'Campo non assegnato'}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ color: m.teamHome.color, fontWeight: 'bold' }}>{m.teamHome.name}</span>
                                                    <span style={{ fontSize: '0.9rem', color: '#999' }}>vs</span>
                                                    <span style={{ color: m.teamAway.color, fontWeight: 'bold' }}>{m.teamAway.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {matchesInSlot[0]?.referee && (
                                            <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                                                👮 Arbitro: {matchesInSlot[0].referee}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '0.8rem', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    Generato automaticamente dal gestionale GREST 2025
                </div>
            </div>
        </div>
    );
}
