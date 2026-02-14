'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/UserManagement';

export default function AdminDashboard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            // router.push('/'); // Optional redirect
        }
    }, [user, isLoading]);

    if (isLoading || (user?.role !== 'admin')) {
        if (!isLoading) return <div className="empty-state">🚫 Accesso Negato</div>;
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="admin-dashboard animate-fade-in">
            <h1 className="page-title">Amministrazione Utenti</h1>
            <UserManagement />
        </div>
    );
}
