
'use client';

import { useState, useEffect } from 'react';
import '../styles/modal.css';

export default function UserManagement() {
    const [users, setUsers] = useState([]);

    // Create Form State (nome + cognome instead of username + password)
    const [form, setForm] = useState({ nome: '', cognome: '', role: 'animatore' });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [teams, setTeams] = useState([]);

    // Credentials Display Modal (after creation or password reset)
    const [credentialsModal, setCredentialsModal] = useState(null);
    // { type: 'created' | 'reset', username: '...', temporaryPassword: '...' }

    useEffect(() => {
        fetchUsers();
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await fetch('/api/config/teams');
            if (res.ok) {
                const data = await res.json();
                setTeams(data);
            }
        } catch (err) {
            console.error('Error fetching teams:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (res.ok) {
                setForm({ nome: '', cognome: '', role: 'animatore' });
                fetchUsers();
                // Show credentials modal
                setCredentialsModal({
                    type: 'created',
                    username: data.username,
                    temporaryPassword: data.temporaryPassword
                });
            } else {
                setMsg({ type: 'error', text: data.message || 'Errore durante la creazione.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`Sei sicuro di voler eliminare l'utente "${user.username}"?`)) return;

        try {
            const res = await fetch(`/api/users?id=${user.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUsers();
                setMsg({ type: 'success', text: 'Utente eliminato.' });
                setTimeout(() => setMsg(null), 3000);
            } else {
                const data = await res.json();
                setMsg({ type: 'error', text: data.message || 'Errore eliminazione utente.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    role: newRole
                })
            });

            if (res.ok) {
                fetchUsers();
                setMsg({ type: 'success', text: 'Ruolo aggiornato.' });
                setTimeout(() => setMsg(null), 3000);
            } else {
                const data = await res.json();
                setMsg({ type: 'error', text: data.message || 'Errore aggiornamento ruolo.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        }
    };

    const handleResetPassword = async (user) => {
        if (!confirm(`Reset password per "${user.username}"?\nVerrà generata una nuova password temporanea.`)) return;

        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    resetPassword: true
                })
            });

            const data = await res.json();

            if (res.ok) {
                fetchUsers();
                // Show credentials modal with new temporary password
                setCredentialsModal({
                    type: 'reset',
                    username: user.username,
                    temporaryPassword: data.temporaryPassword
                });
            } else {
                setMsg({ type: 'error', text: data.message || 'Errore reset password.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        }
    };

    const handleTeamChange = async (user, newTeamId) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    team_id: newTeamId === '' ? null : newTeamId
                })
            });

            if (res.ok) {
                fetchUsers();
                setMsg({ type: 'success', text: 'Squadra aggiornata.' });
                setTimeout(() => setMsg(null), 3000);
            } else {
                const data = await res.json();
                setMsg({ type: 'error', text: data.message || 'Errore aggiornamento squadra.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        }
    };

    const getTeamStyle = (teamId) => {
        if (!teamId) return { 
            background: 'var(--color-bg-main)', 
            color: 'var(--color-text-medium)', 
            border: '1px solid var(--color-border)',
            cursor: 'pointer', outline: 'none', fontFamily: 'inherit'
        };
        const team = teams.find(t => t.id == teamId);
        if (team && team.color_hex) {
            return { 
                background: `${team.color_hex}25`, 
                color: team.color_hex, 
                border: 'none', 
                fontWeight: '600',
                cursor: 'pointer', outline: 'none', fontFamily: 'inherit'
            }; 
        }
        return { background: 'rgba(136,136,136,0.15)', color: 'inherit', border: 'none', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' };
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'badge-primary';
            case 'admin_giochi': return 'badge-success';
            case 'arbitro': return 'badge-info';
            case 'animatore': return 'badge-warning';
            default: return 'badge-secondary';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Admin Totale';
            case 'admin_giochi': return 'Admin Giochi';
            case 'arbitro': return 'Arbitro';
            case 'animatore': return 'Animatore';
            default: return role;
        }
    };

    return (
        <div className="user-management animate-fade-in">
            {/* Create User Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>➕</span> Crea Nuovo Utente
                </h2>

                <form onSubmit={handleCreateSubmit} style={{ 
                    display: 'grid', 
                    gap: '1rem', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    alignItems: 'flex-end' 
                }} autoComplete="off">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Nome</label>
                        <input
                            type="text"
                            name="nome"
                            value={form.nome}
                            onChange={handleChange}
                            required
                            minLength={2}
                            className="input-field"
                            placeholder="es. Mario"
                            autoComplete="off"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Cognome</label>
                        <input
                            type="text"
                            name="cognome"
                            value={form.cognome}
                            onChange={handleChange}
                            required
                            minLength={2}
                            className="input-field"
                            placeholder="es. Rossi"
                            autoComplete="off"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Ruolo</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="animatore">Animatore</option>
                            <option value="arbitro">Arbitro</option>
                            <option value="admin_giochi">Admin Giochi</option>
                            <option value="admin">Admin Totale</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px' }}>
                        {loading ? 'Caricamento...' : 'Crea Utente'}
                    </button>
                </form>

                <p style={{ marginTop: '0.75rem', fontSize: '0.85em', color: 'var(--color-text-light)' }}>
                    Lo username verrà generato come <strong>Nome.Cognome</strong> e la password sarà temporanea.
                </p>
            </div>

            {msg && (
                <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1.5rem' }}>
                    {msg.text}
                </div>
            )}

            {/* User List Section */}
            <div className="card">
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>👥</span> Utenti Esistenti
                </h2>

                <div className="table-responsive">
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border)' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Username</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Ruolo</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Squadra</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Stato</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Creato il</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', background: idx % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-main)' }}>
                                    <td style={{ padding: '0.8rem 1rem', fontWeight: '500', borderRight: '1px solid var(--color-border)' }}>{user.username}</td>
                                    <td style={{ padding: '0.8rem 1rem', borderRight: '1px solid var(--color-border)' }}>
                                        {user.username !== 'admin' ? (
                                            <select 
                                                className={`badge ${getRoleBadgeClass(user.role)}`}
                                                value={user.role} 
                                                onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                style={{ border: 'none', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
                                            >
                                                <option value="animatore" style={{ color: 'initial', background: 'initial' }}>Animatore</option>
                                                <option value="arbitro" style={{ color: 'initial', background: 'initial' }}>Arbitro</option>
                                                <option value="admin_giochi" style={{ color: 'initial', background: 'initial' }}>Admin Giochi</option>
                                                <option value="admin" style={{ color: 'initial', background: 'initial' }}>Admin Totale</option>
                                            </select>
                                        ) : (
                                            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', borderRight: '1px solid var(--color-border)' }}>
                                        <select 
                                            className="badge"
                                            value={user.team_id || ''} 
                                            onChange={(e) => handleTeamChange(user, e.target.value)}
                                            style={getTeamStyle(user.team_id)}
                                        >
                                            <option value="" style={{ color: 'initial', background: 'initial' }}>Nessuna</option>
                                            {teams.map(t => (
                                                <option key={t.id} value={t.id} style={{ color: 'initial', background: 'initial' }}>{t.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', borderRight: '1px solid var(--color-border)' }}>
                                        {user.must_change_password ? (
                                            <span className="badge badge-warning">⏳ Pwd temporanea</span>
                                        ) : (
                                            <span className="badge badge-success">✅ Attivo</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', color: 'var(--color-text-medium)', fontSize: '0.9em', borderRight: '1px solid var(--color-border)' }}>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button
                                                className="btn-icon"
                                                title="Reset Password"
                                                onClick={() => handleResetPassword(user)}
                                                style={{ background: 'var(--color-secondary-light)', color: 'var(--color-primary-dark)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                                            >
                                                🔑
                                            </button>

                                            {user.username !== 'admin' && (
                                                <button
                                                    className="btn-icon"
                                                    title="Elimina Utente"
                                                    onClick={() => handleDelete(user)}
                                                    style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(220, 38, 38, 0.2)' }}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-medium)' }}>
                                        Nessun utente trovato
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Credentials Display Modal */}
            {credentialsModal && (
                <div className="modal-overlay" onClick={() => setCredentialsModal(null)} style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">
                            {credentialsModal.type === 'created' ? '✅ Utente Creato' : '🔑 Password Resettata'}
                        </h2>

                        <div className="credentials-display" style={{ marginBottom: '1.5rem' }}>
                            <div className="cred-label">Username</div>
                            <div className="cred-value">{credentialsModal.username}</div>
                            
                            <hr className="cred-divider" />
                            
                            <div className="cred-label">Password Temporanea</div>
                            <div className="cred-value">{credentialsModal.temporaryPassword}</div>

                            <div className="cred-warning">
                                ⚠️ Comunica queste credenziali all&apos;utente.<br />
                                Dovrà cambiare la password al primo accesso.
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => setCredentialsModal(null)}
                                style={{ width: '100%' }}
                            >
                                Ho Capito, Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
