'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNav } from './NavContext';
import '../styles/navbar.css';

export default function Navbar() {
    const [currentDay, setCurrentDay] = useState(null);
    const [isDark, setIsDark] = useState(false);
    const { toggleSidebar } = useNav();
    const pathname = usePathname();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    useEffect(() => {
        async function fetchDay() {
            try {
                const res = await fetch('/api/config/current-day');
                const data = await res.json();
                setCurrentDay(data.day);
            } catch (err) {
                console.error('Error fetching current day:', err);
            }
        }
        fetchDay();
    }, []);

    const isActive = (path) => pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button className="navbar-logo-btn" onClick={toggleSidebar} aria-label="Menu">
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
                        onDoubleClick={toggleTheme}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Doppio clic per cambiare tema"
                    >
                        Giornata {currentDay}
                    </div>
                )}
            </div>
        </nav>
    );
}
