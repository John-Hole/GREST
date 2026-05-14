'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createPortal } from 'react-dom';

export default function GiochiPage() {
    const { user } = useAuth();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState(null);
    const [editingGame, setEditingGame] = useState(null);
    
    const [modalData, setModalData] = useState({ name: '', rules: '' });
    const [modalError, setModalError] = useState('');

    const isAdmin = user && ['admin', 'admin_giochi'].includes(user.role);

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/games');
            if (res.ok) {
                const data = await res.json();
                setGames(data);
            }
        } catch (err) {
            console.error('Error fetching games:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (game = null) => {
        if (game) {
            setEditingGame(game);
            setModalData({ name: game.name, rules: game.rules || '' });
        } else {
            setEditingGame(null);
            setModalData({ name: '', rules: '' });
        }
        setModalError('');
    };

    const handleCloseModal = () => {
        setEditingGame(null);
        setModalData({ name: '', rules: '' });
        // if we just closed the "add" modal, we want to reset.
        // if we were editing rules from the "selectedGame" view, we don't necessarily want to close the selected game view.
        if (!editingGame) {
            setModalError('');
        }
    };

    const handleSaveGame = async () => {
        if (!modalData.name.trim()) {
            setModalError('Il nome del gioco è obbligatorio');
            return;
        }

        try {
            const isEditing = !!editingGame;
            const url = isEditing ? `/api/games?id=${editingGame.id}` : '/api/games';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modalData)
            });

            const data = await res.json();

            if (!res.ok) {
                setModalError(data.message || data.error?.name?._errors?.[0] || 'Errore durante il salvataggio');
                return;
            }

            await fetchGames();
            
            // If we were editing the currently selected game, update its view too
            if (selectedGame && editingGame && selectedGame.id === editingGame.id) {
                setSelectedGame({ ...selectedGame, name: data.name, rules: data.rules });
            }

            handleCloseModal();
        } catch (err) {
            console.error('Error saving game:', err);
            setModalError('Errore di connessione');
        }
    };

    const handleDeleteGame = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questo gioco?')) return;

        try {
            const res = await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchGames();
                if (selectedGame && selectedGame.id === id) {
                    setSelectedGame(null);
                }
            } else {
                const data = await res.json();
                alert(data.message || `Errore durante l'eliminazione`);
            }
        } catch (err) {
            console.error('Error deleting game:', err);
        }
    };

    // Derived modal state: if editingGame is defined (it's an object) or if we are in 'create new' mode (editingGame is string 'new')
    // Actually, earlier handleOpenEdit(null) means we are creating new, so editingGame is null but modalData is active?
    // Let's use a specific state for isModalOpen.
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Patch handleOpenEdit and handleCloseModal
    const openModal = (game = null) => {
        handleOpenEdit(game);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        handleCloseModal();
        setIsModalOpen(false);
    };

    return (
        <div className="animate-fade-in" style={{ padding: 'var(--spacing-md)', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <span>📖</span> Ricettario Giochi
                </h1>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => openModal(null)}>
                        ➕ Aggiungi Gioco
                    </button>
                )}
            </div>

            {loading ? (
                <div className="spinner-container" style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
            ) : (
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* List of games */}
                    <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {games.length === 0 ? (
                            <p style={{ color: 'var(--color-text-medium)', fontStyle: 'italic' }}>Nessun gioco trovato nel database.</p>
                        ) : (
                            games.map(game => (
                                <div 
                                    key={game.id} 
                                    className={`card clickable-card ${selectedGame?.id === game.id ? 'active-game' : ''}`}
                                    onClick={() => setSelectedGame(game)}
                                    style={{ 
                                        padding: '1rem', 
                                        border: selectedGame?.id === game.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                                        {game.name}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {game.rules && game.rules.trim() ? (
                                            <span style={{ fontSize: '0.8em', color: 'var(--color-success)' }}>✓ Regole</span>
                                        ) : (
                                            <span style={{ fontSize: '0.8em', color: 'var(--color-danger)' }}>⚠ No Regole</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Details View */}
                    <div style={{ flex: '2 1 400px' }}>
                        {selectedGame ? (
                            <div className="card" style={{ padding: '1.5rem', position: 'relative', minHeight: '300px' }}>
                                <div style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{selectedGame.name}</h2>
                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openModal(selectedGame)}>
                                                ✏️ Modifica
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteGame(selectedGame.id)}>
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <h3 style={{ fontSize: '1.1em', color: 'var(--color-text-medium)', marginBottom: '0.8rem' }}>Regole del gioco:</h3>
                                    {selectedGame.rules && selectedGame.rules.trim() ? (
                                        <div style={{ 
                                            whiteSpace: 'pre-wrap', 
                                            lineHeight: '1.6', 
                                            backgroundColor: 'var(--color-bg-alt)', 
                                            padding: '1rem', 
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)'
                                        }}>
                                            {selectedGame.rules}
                                        </div>
                                    ) : (
                                        <div style={{ fontStyle: 'italic', color: 'var(--color-text-light)', padding: '1rem', backgroundColor: 'var(--color-bg-alt)', borderRadius: '8px' }}>
                                            Nessuna regola inserita per questo gioco.
                                            {isAdmin && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openModal(selectedGame)}>Aggiungi regole ora</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-medium)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>👈</div>
                                <p>Seleziona un gioco dalla lista per leggerne le regole</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal for Add/Edit Game */}
            {isModalOpen && createPortal(
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                        <h3 className="modal-title" style={{ marginBottom: '1rem' }}>
                            {editingGame ? 'Modifica Gioco' : 'Aggiungi Nuovo Gioco'}
                        </h3>
                        
                        {modalError && (
                            <div className="notification notification-error" style={{ marginBottom: '1rem', padding: '0.5rem', fontSize: '0.9em' }}>
                                {modalError}
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>Nome del Gioco *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={modalData.name}
                                onChange={e => setModalData({ ...modalData, name: e.target.value })}
                                placeholder="Es. Rubabandiera"
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>Regole e Descrizione</label>
                            <textarea
                                className="input-field"
                                value={modalData.rules}
                                onChange={e => setModalData({ ...modalData, rules: e.target.value })}
                                placeholder="Scrivi qui le regole del gioco, come funziona, materiali necessari, ecc..."
                                rows={10}
                                style={{ width: '100%', padding: '8px', resize: 'vertical' }}
                            />
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                            <button className="btn btn-secondary" onClick={closeModal}>Annulla</button>
                            <button className="btn btn-primary" onClick={handleSaveGame}>Salva Gioco</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
