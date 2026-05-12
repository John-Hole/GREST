'use client';

import { useAuth } from '@/components/AuthProvider';
import ForcePasswordChange from '@/components/ForcePasswordChange';

/**
 * Wrapper che mostra l'overlay ForcePasswordChange quando l'utente
 * ha una password temporanea (mustChangePassword = true).
 * Viene montato nel layout al di fuori del flusso normale.
 */
export default function ForcePasswordChangeWrapper() {
    const { user, isLoading, clearMustChangePassword } = useAuth();

    // Non mostrare nulla durante il loading o se non c'è utente
    if (isLoading || !user) return null;

    // Mostra overlay solo se l'utente deve cambiare password
    if (!user.mustChangePassword) return null;

    return (
        <ForcePasswordChange
            username={user.username}
            onPasswordChanged={clearMustChangePassword}
        />
    );
}
