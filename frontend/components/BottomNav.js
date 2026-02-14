'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import '../styles/bottom-nav.css';

export default function BottomNav() {
    const pathname = usePathname();
    const { user } = useAuth();

    const isActive = (path) => pathname === path;

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-items">
                <Link
                    href="/"
                    className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}
                >
                    <span className="bottom-nav-icon">🏠</span>
                    <span>Home</span>
                </Link>

                <Link
                    href="/calendario"
                    className={`bottom-nav-item ${isActive('/calendario') ? 'active' : ''}`}
                >
                    <span className="bottom-nav-icon">📅</span>
                    <span>Cal.</span>
                </Link>

                <Link
                    href="/classifica"
                    className={`bottom-nav-item ${isActive('/classifica') ? 'active' : ''}`}
                >
                    <span className="bottom-nav-icon">🏆</span>
                    <span>Class.</span>
                </Link>

                {user && user.role === 'admin' && (
                    <Link
                        href="/admin"
                        className={`bottom-nav-item ${isActive('/admin') ? 'active' : ''}`}
                    >
                        <span className="bottom-nav-icon">⚙️</span>
                        <span>Admin</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
