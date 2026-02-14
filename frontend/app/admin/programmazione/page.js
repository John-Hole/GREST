
'use client';

import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GameProgramming from '../../../components/GameProgramming';
import { useEffect } from 'react';

export default function ProgrammazionePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            // router.push('/'); 
        }
    }, [user, isLoading]);

    if (isLoading || (user?.role !== 'admin')) {
        if (!isLoading) return <div className="empty-state">🚫 Accesso Negato</div>;
        return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="programmazione-page animate-fade-in">
            <h1 className="page-title">Programmazione Giochi</h1>
            <GameProgramming />
        </div>
    );
}
