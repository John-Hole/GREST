'use client';

import { useState, useEffect } from 'react';
import MatchCard from '@/components/MatchCard';
import MatchEditModal from '@/components/MatchEditModal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';

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

    const canEdit = user && (user.role === 'admin' || user.role === 'operator');

    const getMatchesForSlot = (timeSlot) => {
        return matches.filter(m => m.timeSlot === timeSlot);
    };

    if (loading && matches.length === 0) {
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="calendar-page">
            <h1 className="page-title">Calendario Partite</h1>

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
        </div>
    );
}
