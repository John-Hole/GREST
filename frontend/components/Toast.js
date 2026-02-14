'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import '../styles/toast.css';

const ToastContext = createContext({
    showToast: (args) => { },
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback(({ type = 'info', message, duration = 4000 }) => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        // Add new toast to head
        setToasts((prev) => [...prev, { id, type, message, exiting: false }]);

        // Auto dismiss
        setTimeout(() => {
            dismissToast(id);
        }, duration);
    }, []);

    const dismissToast = useCallback((id) => {
        // Mark as exiting first for animation
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, exiting: true } : t));

        // Remove after animation time
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300); // 300ms matches CSS animation
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast ${toast.type} ${toast.exiting ? 'exiting' : ''}`}
                        role="alert"
                    >
                        <div className="toast-icon">
                            {toast.type === 'success' && '✅'}
                            {toast.type === 'error' && '❌'}
                            {toast.type === 'warning' && '⚠️'}
                            {toast.type === 'info' && 'ℹ️'}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                        <button
                            className="toast-close"
                            onClick={() => dismissToast(toast.id)}
                            aria-label="Chiudi notifica"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
