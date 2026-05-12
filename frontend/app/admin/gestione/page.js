'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function GestioneTorneo() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [startDate, setStartDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchStartDate();
        }
    }, [user]);

    const fetchStartDate = async () => {
        try {
            const res = await fetch('/api/config/start-date');
            if (res.ok) {
                const data = await res.json();
                if (data.startDate) {
                    setStartDate(data.startDate);
                }
            }
        } catch (error) {
            console.error('Errore nel caricamento della data iniziale', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch('/api/config/start-date', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate })
            });

            if (res.ok) {
                setMsg({ type: 'success', text: 'Data di inizio salvata e calendario ricalcolato con successo! Ricaricamento...' });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                const data = await res.json();
                setMsg({ type: 'error', text: data.message || 'Errore durante il salvataggio' });
            }
        } catch (error) {
            setMsg({ type: 'error', text: 'Errore di connessione' });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                <span>⚙️</span> Gestione Torneo
            </h1>

            <div className="card" style={{ maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Impostazioni Generali</h2>

                {msg && (
                    <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem' }}>
                        {msg.text}
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Data di Inizio Torneo</label>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Impostando questa data, verranno ricalcolate automaticamente le date di tutte le 15 giornate del torneo, saltando i sabati e le domeniche.
                    </p>
                    <input
                        type="date"
                        className="input-field"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    />
                </div>

                <button 
                    className="btn btn-primary" 
                    onClick={handleSave} 
                    disabled={saving || !startDate}
                >
                    {saving ? 'Salvataggio in corso...' : '💾 Salva Impostazioni'}
                </button>
            </div>
        </div>
    );
}
