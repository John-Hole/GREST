'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';

export default function BriefingPage() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(null);
    const [tournamentDays] = useState(Array.from({ length: 15 }, (_, i) => i + 1));
    const [briefingContent, setBriefingContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isPrivileged = user && ['admin', 'admin_giochi'].includes(user.role);

    // Initial fetch for current day
    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('/api/config/current-day');
                const data = await res.json();
                const current = data.realDay || 1;
                setSelectedDay(current);
                // The fetchBriefing for the initial day will be triggered by the second useEffect
            } catch (e) {
                console.error(e);
                setSelectedDay(1); // Fallback to day 1
            }
        };
        init();
    }, []);

    // Fetch briefing whenever selectedDay changes
    useEffect(() => {
        if (selectedDay === null) return;

        const fetchBriefing = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/briefings?day=${selectedDay}`);
                const data = await res.json();
                setBriefingContent(data.content || '');
            } catch (err) {
                console.error('Error fetching briefing', err);
                showToast({ type: 'error', message: 'Errore nel caricamento del briefing' });
            } finally {
                setLoading(false);
            }
        };

        fetchBriefing();
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

    const handleExportCurrent = () => {
        if (!briefingContent) {
            showToast({ type: 'warning', message: 'Nessun contenuto da esportare' });
            return;
        }
        
        const blob = new Blob([briefingContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `briefing_giorno_${selectedDay}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportAll = async () => {
        try {
            const res = await fetch('/api/briefings?day=all');
            const data = await res.json();
            
            if (!data.briefings || data.briefings.length === 0) {
                showToast({ type: 'warning', message: 'Nessun briefing trovato' });
                return;
            }

            let fullContent = 'TUTTI I BRIEFING\n\n';
            data.briefings.forEach(b => {
                fullContent += `--- GIORNO ${b.day_number} ---\n`;
                fullContent += `${b.content}\n\n`;
            });

            const blob = new Blob([fullContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tutti_i_briefing.txt`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error', err);
            showToast({ type: 'error', message: 'Errore durante l\'esportazione' });
        }
    };

    if (selectedDay === null) {
        return (
            <div className="briefing-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--color-text-medium)' }}>Caricamento briefing...</p>
            </div>
        );
    }

    return (
        <div className="briefing-page animate-fade-in">
            <div className="briefing-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Briefing Giornaliero</h1>
                    <p style={{ color: 'var(--color-text-medium)', margin: 0 }}>
                        Comunicazioni e note per lo staff, organizzate per giornata.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={handleExportCurrent} title="Esporta briefing di oggi">
                        📤 Esporta
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportAll} title="Esporta tutti i briefing">
                        📂 Esporta Tutto
                    </button>
                </div>
            </div>

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
                        backgroundColor: 'var(--color-bg-card)',
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
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'var(--color-bg-main)',
                                        color: 'var(--color-text-dark)',
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
