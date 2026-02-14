'use client';

import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ImpostazioniPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [locations, setLocations] = useState([]);
    const [referees, setReferees] = useState([]);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            // router.push('/');
        }
    }, [user, isLoading]);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchLocations();
            fetchReferees();
        }
    }, [user]);

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

    if (isLoading || (user?.role !== 'admin')) {
        if (!isLoading) return <div className="empty-state">🚫 Accesso Negato</div>;
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="impostazioni-page animate-fade-in">
            <h1 className="page-title">⚙️ Impostazioni</h1>

            {msg && (
                <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1.5rem' }}>
                    {msg.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '1200px' }}>
                {/* Locations Management */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.3em', marginBottom: '1.5rem', color: 'var(--color-primary-medium)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📍</span> Gestione Luoghi
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="Nuovo luogo"
                            id="newLocationInput"
                            className="input-field"
                            style={{ flex: 1 }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    document.getElementById('addLocationBtn').click();
                                }
                            }}
                        />
                        <button
                            id="addLocationBtn"
                            className="btn btn-primary"
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
                                        setTimeout(() => setMsg(null), 3000);
                                    } else {
                                        const data = await res.json();
                                        setMsg({ type: 'error', text: data.message || 'Errore aggiunta luogo.' });
                                    }
                                } catch (e) {
                                    console.error(e);
                                    setMsg({ type: 'error', text: 'Errore di connessione.' });
                                }
                            }}
                        >
                            ➕ Aggiungi
                        </button>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                        {!Array.isArray(locations) || locations.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-medium)' }}>
                                Nessun luogo configurato
                            </div>
                        ) : (
                            locations.map((loc, idx) => (
                                <div
                                    key={loc.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        borderBottom: idx < locations.length - 1 ? '1px solid var(--color-border)' : 'none'
                                    }}
                                >
                                    <span style={{ fontWeight: '500' }}>{loc.name}</span>
                                    <button
                                        className="btn-icon"
                                        onClick={async () => {
                                            if (confirm(`Eliminare "${loc.name}"?`)) {
                                                try {
                                                    await fetch(`/api/locations?id=${loc.id}`, { method: 'DELETE' });
                                                    fetchLocations();
                                                    setTimeout(() => setMsg(null), 3000);
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '1.2em',
                                            opacity: 0.6,
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                                        onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Referees Management */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.3em', marginBottom: '1.5rem', color: 'var(--color-primary-medium)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>👤</span> Gestione Arbitri
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="Nuovo arbitro"
                            id="newRefereeInput"
                            className="input-field"
                            style={{ flex: 1 }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    document.getElementById('addRefereeBtn').click();
                                }
                            }}
                        />
                        <button
                            id="addRefereeBtn"
                            className="btn btn-primary"
                            onClick={async () => {
                                const input = document.getElementById('newRefereeInput');
                                const val = input.value.trim();
                                if (!val) return;
                                try {
                                    const res = await fetch('/api/referees', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name: val })
                                    });
                                    if (res.ok) {
                                        input.value = '';
                                        fetchReferees();
                                        setTimeout(() => setMsg(null), 3000);
                                    } else {
                                        const data = await res.json();
                                        setMsg({ type: 'error', text: data.message || 'Errore aggiunta arbitro.' });
                                    }
                                } catch (e) {
                                    console.error(e);
                                    setMsg({ type: 'error', text: 'Errore di connessione.' });
                                }
                            }}
                        >
                            ➕ Aggiungi
                        </button>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                        {!Array.isArray(referees) || referees.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-medium)' }}>
                                Nessun arbitro configurato
                            </div>
                        ) : (
                            referees.map((ref, idx) => (
                                <div
                                    key={ref.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        borderBottom: idx < referees.length - 1 ? '1px solid var(--color-border)' : 'none'
                                    }}
                                >
                                    <span style={{ fontWeight: '500' }}>{ref.name}</span>
                                    <button
                                        className="btn-icon"
                                        onClick={async () => {
                                            if (confirm(`Eliminare "${ref.name}"?`)) {
                                                try {
                                                    await fetch(`/api/referees?id=${ref.id}`, { method: 'DELETE' });
                                                    fetchReferees();
                                                    setTimeout(() => setMsg(null), 3000);
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '1.2em',
                                            opacity: 0.6,
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                                        onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
