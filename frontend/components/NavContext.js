'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const NavContext = createContext();

export function NavProvider({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);
    const openSidebar = () => setIsSidebarOpen(true);

    return (
        <NavContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar, openSidebar }}>
            {children}
        </NavContext.Provider>
    );
}

export const useNav = () => useContext(NavContext);
