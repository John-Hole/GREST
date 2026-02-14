'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import '../styles/toast.css';

const ToastContext = createContext({
    showToast: (args) => { },
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const showToast = useCallback(({ type = 'info', message, duration = 4000 }) => {
        const id = Date.now().toString() + Math.random().toString().slice(2);

        setToasts((prev) => [...prev, { id, type, message, duration, exiting: false }]);

        // Auto dismiss
        timersRef.current[id] = setTimeout(() => {
            dismissToast(id);
        }, duration);
    }, []);

    const dismissToast = useCallback((id) => {
        // Clear any pending timer
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }

        // Mark as exiting for animation
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, exiting: true } : t));

        // Remove after exit animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 350);
    }, []);

    const pauseTimer = useCallback((id) => {
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
    }, []);

    const resumeTimer = useCallback((id, remainingDuration) => {
        timersRef.current[id] = setTimeout(() => {
            dismissToast(id);
        }, remainingDuration);
    }, []);

    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'i',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast ${toast.type} ${toast.exiting ? 'exiting' : ''}`}
                        role="alert"
                        onClick={() => dismissToast(toast.id)}
                        onMouseEnter={() => pauseTimer(toast.id)}
                        onMouseLeave={() => resumeTimer(toast.id, 2000)}
                    >
                        <div className="toast-icon">
                            {iconMap[toast.type] || 'i'}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                        <button
                            className="toast-close"
                            onClick={(e) => {
                                e.stopPropagation();
                                dismissToast(toast.id);
                            }}
                            aria-label="Chiudi notifica"
                        >
                            ×
                        </button>
                        <div
                            className="toast-progress"
                            style={{ '--toast-duration': `${toast.duration}ms` }}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
