'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNav } from './NavContext';
import { useAuth } from './AuthProvider';
import '../styles/navbar.css';

export default function Navbar() {
    const [currentDay, setCurrentDay] = useState(null);
    const [isDark, setIsDark] = useState(false);
    const { toggleSidebar } = useNav();
    const { user } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    // Sync with user account theme if available
    useEffect(() => {
        if (user && user.theme) {
            const isUserThemeDark = user.theme === 'dark';
            if (isUserThemeDark !== isDark) {
                setIsDark(isUserThemeDark);
                if (isUserThemeDark) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                }
            }
        }
    }, [user]);

    const toggleTheme = async () => {
        const newDark = !isDark;
        setIsDark(newDark);
        const themeStr = newDark ? 'dark' : 'light';
        
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }

        // Save to account invisibly if logged in
        if (user) {
            try {
                await fetch('/api/users/theme', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme: themeStr }),
                });
            } catch (err) {
                console.error('Failed to save theme to account', err);
            }
        }
    };

    useEffect(() => {
        async function fetchDay() {
            try {
                const res = await fetch('/api/config/current-day');
                const data = await res.json();
                setCurrentDay(data.giornataCorrente);
            } catch (err) {
                console.error('Error fetching current day:', err);
            }
        }
        fetchDay();
    }, []);

    const isActive = (path) => pathname === path;

    const handleLogoClick = () => {
        // Only toggle sidebar on mobile/tablet view where sidebar is hidden by default
        if (typeof window !== 'undefined' && window.innerWidth <= 1023) {
            toggleSidebar();
        }
    };

    const [lastClickTime, setLastClickTime] = useState(0);

    const handleDayClick = () => {
        const now = Date.now();
        if (now - lastClickTime < 300) {
            toggleTheme();
        }
        setLastClickTime(now);
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button className="navbar-logo-btn" onClick={handleLogoClick} aria-label="Menu">
                    <img src="/logo.png" alt="Logo" className="navbar-logo-img" />
                    Grest <span>PSG</span>
                </button>
            </div>

            <div className="navbar-center">
                <Link href="/" className={`nav-icon-btn ${isActive('/') ? 'active' : ''}`} title="Home">
                    🏠
                </Link>
                <Link href="/calendario" className={`nav-icon-btn ${isActive('/calendario') ? 'active' : ''}`} title="Calendario">
                    📅
                </Link>
            </div>

            <div className="navbar-right">
                {currentDay && (
                    <div 
                        className="navbar-day" 
                        onClick={handleDayClick}
                        style={{ cursor: 'pointer', userSelect: 'none', touchAction: 'manipulation' }}
                        title="Doppio clic per cambiare tema"
                    >
                        Giornata {currentDay}
                    </div>
                )}
            </div>
        </nav>
    );
}
