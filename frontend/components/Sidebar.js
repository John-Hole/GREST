'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useToast } from './Toast';
import { useNav } from './NavContext';
import '../styles/sidebar.css';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, login, logout } = useAuth();
    const { showToast } = useToast();
    const { isSidebarOpen, closeSidebar } = useNav();

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
            setIsLoginOpen(false);
            setUsername('');
            setPassword('');
        } else {
            showToast({ type: 'error', message: result.error || 'Credenziali non valide' });
        }
    };

    const handleLogout = () => {
        logout();
    };

    const isActive = (path) => pathname === path;

    return (
        <>
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <nav className="sidebar-nav">
                    <Link
                        href="/"
                        className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className="sidebar-link-icon">🏠</span>
                        <span className="sidebar-link-label">Home</span>
                    </Link>

                    <Link
                        href="/calendario"
                        className={`sidebar-link ${isActive('/calendario') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className="sidebar-link-icon">📅</span>
                        <span className="sidebar-link-label">Calendario</span>
                    </Link>

                    <Link
                        href="/classifica"
                        className={`sidebar-link ${isActive('/classifica') ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className="sidebar-link-icon">🏆</span>
                        <span className="sidebar-link-label">Classifica</span>
                    </Link>

                    {user && (
                        <>
                            <div className="sidebar-divider" />

                            {['admin', 'admin_giochi', 'arbitro'].includes(user.role) && (
                                <Link
                                    href="/bonus"
                                    className={`sidebar-link ${isActive('/bonus') ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <span className="sidebar-link-icon">➕</span>
                                    <span className="sidebar-link-label">Bonus/Malus</span>
                                </Link>
                            )}

                            {['admin', 'admin_giochi'].includes(user.role) && (
                                <>
                                    <Link
                                        href="/admin/programmazione"
                                        className={`sidebar-link ${isActive('/admin/programmazione') ? 'active' : ''}`}
                                        onClick={closeSidebar}
                                    >
                                        <span className="sidebar-link-icon">🎮</span>
                                        <span className="sidebar-link-label">Programmazione</span>
                                    </Link>

                                    <Link
                                        href="/admin/impostazioni"
                                        className={`sidebar-link ${isActive('/admin/impostazioni') ? 'active' : ''}`}
                                        onClick={closeSidebar}
                                    >
                                        <span className="sidebar-link-icon">📋</span>
                                        <span className="sidebar-link-label">Liste</span>
                                    </Link>
                                </>
                            )}

                            {user.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <span className="sidebar-link-icon">👥</span>
                                    <span className="sidebar-link-label">Utenti</span>
                                </Link>
                            )}
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="login-box" ref={loginRef}>
                        {user ? (
                            <div className="sidebar-user-info">
                                <div className="user-details">
                                    <span className="username">{user.username}</span>
                                    <span className="role-badge">
                                        {user.role === 'admin' ? 'Admin Totale' :
                                            user.role === 'admin_giochi' ? 'Admin Giochi' :
                                                user.role === 'arbitro' ? 'Arbitro' : ''}
                                    </span>
                                </div>
                                <button className="logout-btn" onClick={handleLogout} title="Esci">
                                    🚪 Esci
                                </button>
                            </div>
                        ) : (
                            <div className="login-container">
                                <button
                                    className="login-btn"
                                    onClick={() => setIsLoginOpen(!isLoginOpen)}
                                >
                                    🔑 Accedi
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
                </div>
            </aside>
        </>
    );
}
