'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useToast } from './Toast';
import '../styles/navbar.css';

export default function Navbar() {
    const { user, login, logout } = useAuth();
    const { showToast } = useToast();

    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const loginRef = useRef(null);

    // Close login dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (loginRef.current && !loginRef.current.contains(event.target)) {
                setIsLoginOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        const result = await login(username, password);

        if (result.success) {
            showToast({ type: 'success', message: 'Login effettuato con successo!' });
            setIsLoginOpen(false);
            setUsername('');
            setPassword('');
        } else {
            showToast({ type: 'error', message: result.error || 'Credenziali non valide' });
        }
    };

    const handleLogout = () => {
        logout();
        showToast({ type: 'info', message: 'Logout effettuato' });
    };

    return (
        <nav className="navbar">
            <Link href="/" className="navbar-logo">
                Grest <span>PSG</span>
            </Link>

            <div className="navbar-actions">
                {user ? (
                    <div className="navbar-user-info">
                        <span className="role-badge">{user.role}</span>
                        <span className="username">{user.username}</span>
                        <button className="logout-btn" onClick={handleLogout} title="Esci">
                            Esci
                        </button>
                    </div>
                ) : (
                    <div className="login-container" ref={loginRef}>
                        <button
                            className="login-btn"
                            onClick={() => setIsLoginOpen(!isLoginOpen)}
                        >
                            Accedi
                        </button>

                        {isLoginOpen && (
                            <div className="login-dropdown">
                                <h3>Area Riservata</h3>
                                <form onSubmit={handleLogin}>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary">
                                        Entra
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
