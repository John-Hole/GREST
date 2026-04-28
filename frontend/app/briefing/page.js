'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';

export default function BriefingPage() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(1);
    const [tournamentDays] = useState(Array.from({ length: 15 }, (_, i) => i + 1));
    const [briefingContent, setBriefingContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isPrivileged = user && ['admin', 'admin_giochi'].includes(user.role);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch current day
                const res = await fetch('/api/config/current-day');
                const data = await res.json();
                const current = data.day || 1;
                // Default to previous day, min 1
                setSelectedDay(Math.max(1, current - 1));
            } catch (e) {
                console.error(e);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const fetchBriefing = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/briefings?day=${selectedDay}`);
                const data = await res.json();
                setBriefingContent(data.content || '');
            } catch (err) {
                console.error('Error fetching briefing', err);
            } finally {
                setLoading(false);
            }
        };

        if (selectedDay) {
            fetchBriefing();
        }
    }, [selectedDay]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/briefings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    day_number: selectedDay,
                    content: briefingContent
                })
            });

            if (res.ok) {
                showToast({ type: 'success', message: 'Briefing salvato con successo!' });
            } else {
                const errorData = await res.json();
                showToast({ type: 'error', message: errorData.message || 'Errore nel salvataggio' });
            }
        } catch (err) {
            console.error('Save error', err);
            showToast({ type: 'error', message: 'Errore di connessione' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="briefing-page animate-fade-in">
            <h1 className="page-title">Briefing Giornaliero</h1>
            <p style={{ color: 'var(--color-text-medium)', marginBottom: '2rem' }}>
                Comunicazioni e note per lo staff, organizzate per giornata.
            </p>

            <div className="day-selector-container card" style={{ marginBottom: '2rem' }}>
                <label htmlFor="day-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--color-text-dark)' }}>
                    Seleziona Giorno:
                </label>
                <select
                    id="day-select"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        fontSize: '1.1rem',
                        border: '2px solid var(--color-primary)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'white',
                        color: 'var(--color-text-dark)',
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231565C0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.7rem top 50%',
                        backgroundSize: '0.65rem auto'
                    }}
                >
                    {tournamentDays.map(day => (
                        <option key={day} value={day}>
                            Giorno {day}
                        </option>
                    ))}
                </select>
            </div>

            <div className="card">
                {loading ? (
                    <div className="spinner-container" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {isPrivileged ? (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Testo del Briefing:
                                </label>
                                <textarea
                                    value={briefingContent}
                                    onChange={(e) => setBriefingContent(e.target.value)}
                                    rows="10"
                                    placeholder="Scrivi qui le comunicazioni per la giornata..."
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        border: '1px solid #ccc',
                                        borderRadius: 'var(--radius-sm)',
                                        fontFamily: 'inherit',
                                        fontSize: '1rem',
                                        resize: 'vertical',
                                        marginBottom: '1rem'
                                    }}
                                />
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    style={{ width: '100%' }}
                                >
                                    {isSaving ? 'Salvataggio...' : '💾 Salva Briefing'}
                                </button>
                            </div>
                        ) : (
                            <div className="briefing-content" style={{ padding: '1rem' }}>
                                {briefingContent ? (
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                        {briefingContent}
                                    </div>
                                ) : (
                                    <div className="empty-state" style={{ margin: 0, padding: '2rem 0' }}>
                                        Nessun briefing inserito per questa giornata.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
