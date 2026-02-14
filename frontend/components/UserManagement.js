
'use client';

import { useState, useEffect } from 'react';
import '../styles/modal.css';

export default function UserManagement() {
    const [users, setUsers] = useState([]);

    // Create Form State
    const [form, setForm] = useState({ username: '', password: '', role: 'arbitro' });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // Password Update Modal State
    const [pwdModalOpen, setPwdModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [modalMsg, setModalMsg] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

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
                setForm({ username: '', password: '', role: 'arbitro' });
                fetchUsers();
                setMsg({ type: 'success', text: 'Utente creato con successo!' });
                setTimeout(() => setMsg(null), 3000);
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

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setModalMsg(null);
        setPwdModalOpen(true);
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        // Basic Check
        if (newPassword.length < 6) {
            setModalMsg({ type: 'error', text: 'La password deve essere di almeno 6 caratteri.' });
            return;
        }

        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedUser.id,
                    password: newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setPwdModalOpen(false);
                setSelectedUser(null);
                setMsg({ type: 'success', text: `Password aggiornata per ${selectedUser.username}` });
                setTimeout(() => setMsg(null), 3000);
            } else {
                setModalMsg({ type: 'error', text: data.message || 'Errore aggiornamento password.' });
            }
        } catch (err) {
            setModalMsg({ type: 'error', text: 'Errore di connessione.' });
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'badge-primary';
            case 'admin_giochi': return 'badge-success';
            case 'arbitro': return 'badge-info';
            default: return 'badge-secondary';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Admin Totale';
            case 'admin_giochi': return 'Admin Giochi';
            case 'arbitro': return 'Arbitro';
            default: return role;
        }
    };

    return (
        <div className="user-management animate-fade-in">
            {/* Create User Section */}
            <div className="card mb-8">
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>➕</span> Crea Nuovo Utente
                </h2>

                <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', alignItems: 'end' }}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="Nuovo username"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password Iniziale</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            className="input-field"
                            placeholder="Min. 6 caratteri"
                        />
                    </div>
                    <div className="form-group">
                        <label>Ruolo</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="arbitro">Arbitro</option>
                            <option value="admin_giochi">Admin Giochi</option>
                            <option value="admin">Admin Totale</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '48px' }}>
                        {loading ? 'Caricamento...' : 'Crea Utente'}
                    </button>
                </form>
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
                                <th style={{ padding: '1rem', textAlign: 'left', borderRight: '1px solid var(--color-border)' }}>Creato il</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', background: idx % 2 === 0 ? 'white' : 'var(--color-bg-main)' }}>
                                    <td style={{ padding: '0.8rem 1rem', fontWeight: '500', borderRight: '1px solid var(--color-border)' }}>{user.username}</td>
                                    <td style={{ padding: '0.8rem 1rem', borderRight: '1px solid var(--color-border)' }}>
                                        <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', color: 'var(--color-text-medium)', fontSize: '0.9em', borderRight: '1px solid var(--color-border)' }}>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button
                                                className="btn-icon"
                                                title="Cambia Password"
                                                onClick={() => openPasswordModal(user)}
                                                style={{ background: 'var(--color-secondary-light)', color: 'var(--color-secondary-dark)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                                            >
                                                🔑
                                            </button>

                                            {user.username !== 'admin' && (
                                                <button
                                                    className="btn-icon"
                                                    title="Elimina Utente"
                                                    onClick={() => handleDelete(user)}
                                                    style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fecaca' }}
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
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-medium)' }}>
                                        Nessun utente trovato
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Password Change Modal */}
            {pwdModalOpen && (
                <div className="modal-overlay" onClick={() => setPwdModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Cambia Password</h2>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            Utente: <strong>{selectedUser?.username}</strong>
                        </div>

                        {modalMsg && (
                            <div className={`notification ${modalMsg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ padding: '0.5rem', marginBottom: '1rem', fontSize: '0.9em' }}>
                                {modalMsg.text}
                            </div>
                        )}

                        <form onSubmit={handlePasswordUpdate}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setPwdModalOpen(false)}>
                                    Annulla
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Salva Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
