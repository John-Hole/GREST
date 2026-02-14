
'use client';

import { useState, useEffect } from 'react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ username: '', password: '', role: 'operator' });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

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

    const handleSubmit = async (e) => {
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
                setForm({ username: '', password: '', role: 'operator' });
                fetchUsers();
            } else {
                setMsg({ type: 'error', text: data.message || 'Errore durante la creazione.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Errore di connessione.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade-in">
            <h2 className="section-title">Gestione Utenti</h2>

            <form onSubmit={handleSubmit} className="mb-8" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', alignItems: 'end' }}>
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        className="input-field"
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="input-field"
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
                        <option value="operator">Operatore</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Caricamento...' : 'Crea Utente'}
                </button>
            </form>

            {msg && (
                <div className={`notification ${msg.type === 'error' ? 'notification-error' : 'notification-success'}`} style={{ marginBottom: '1rem' }}>
                    {msg.text}
                </div>
            )}

            <div className="table-responsive">
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Ruolo</th>
                            <th>Creato il</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>
                                    <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center' }}>Nessun utente trovato</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
