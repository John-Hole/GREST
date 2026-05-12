'use client';

import { useState } from 'react';
import '../styles/modal.css';

export default function ForcePasswordChange({ username, onPasswordChanged }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('La password deve essere di almeno 6 caratteri.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Le password non coincidono.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Errore durante il cambio password.');
                return;
            }

            onPasswordChanged();
        } catch (err) {
            setError('Errore di connessione.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="force-pwd-overlay">
            <div className="force-pwd-card">
                <div className="force-pwd-icon">🔐</div>
                <h2 className="force-pwd-title">Cambio Password Obbligatorio</h2>
                <p className="force-pwd-subtitle">
                    Ciao <strong>{username}</strong>, devi scegliere una nuova password per continuare.
                </p>

                {error && (
                    <div className="notification notification-error" style={{ marginBottom: '1rem', padding: '0.75rem', fontSize: '0.9em' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Nuova Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimo 6 caratteri"
                            className="input-field"
                            required
                            minLength={6}
                            autoFocus
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Conferma Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ripeti la password"
                            className="input-field"
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.85rem', fontSize: '1.05em' }}
                    >
                        {loading ? 'Salvataggio...' : 'Salva Nuova Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
