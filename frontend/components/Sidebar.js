'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import '../styles/sidebar.css';

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    const isActive = (path) => pathname === path;

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                <Link
                    href="/"
                    className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
                >
                    <span className="sidebar-link-icon">🏠</span>
                    <span className="sidebar-link-label">Home</span>
                </Link>

                <Link
                    href="/calendario"
                    className={`sidebar-link ${isActive('/calendario') ? 'active' : ''}`}
                >
                    <span className="sidebar-link-icon">📅</span>
                    <span className="sidebar-link-label">Calendario</span>
                </Link>

                <Link
                    href="/classifica"
                    className={`sidebar-link ${isActive('/classifica') ? 'active' : ''}`}
                >
                    <span className="sidebar-link-icon">🏆</span>
                    <span className="sidebar-link-label">Classifica</span>
                </Link>

                {user && user.role === 'admin' && (
                    <>
                        <div className="sidebar-divider" />

                        <Link
                            href="/bonus"
                            className={`sidebar-link ${isActive('/bonus') ? 'active' : ''}`}
                        >
                            <span className="sidebar-link-icon">➕</span>
                            <span className="sidebar-link-label">Bonus/Malus</span>
                        </Link>

                        <Link
                            href="/admin/programmazione"
                            className={`sidebar-link ${isActive('/admin/programmazione') ? 'active' : ''}`}
                        >
                            <span className="sidebar-link-icon">🎮</span>
                            <span className="sidebar-link-label">Programmazione</span>
                        </Link>

                        <Link
                            href="/admin"
                            className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                        >
                            <span className="sidebar-link-icon">👥</span>
                            <span className="sidebar-link-label">Utenti</span>
                        </Link>
                    </>
                )}
            </nav>
        </aside>
    );
}
