'use client';

import { useState, useEffect } from 'react';
import '../styles/modal.css';

export default function MatchEditModal({ match, isOpen, onClose, onSave, isSaving }) {
    const [scoreHome, setScoreHome] = useState('');
    const [scoreAway, setScoreAway] = useState('');
    const [notes, setNotes] = useState('');

    // Reset state when modal opens with new match
    useEffect(() => {
        if (match) {
            setScoreHome(match.scoreHome ?? '');
            setScoreAway(match.scoreAway ?? '');
            setNotes(match.refereeNotes || '');
        }
    }, [match]);

    if (!isOpen || !match) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            scoreHome: scoreHome === '' ? null : parseInt(scoreHome),
            scoreAway: scoreAway === '' ? null : parseInt(scoreAway),
            refereeNotes: notes
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <h2 className="modal-title">Modifica Partita</h2>

                <form onSubmit={handleSubmit}>
                    <div className="modal-match-display">
                        <div className="modal-team">
                            <span className="modal-team-name">{match.teamHome.name}</span>
                            <input
                                type="number"
                                min="0"
                                className="modal-score-input"
                                value={scoreHome}
                                onChange={(e) => setScoreHome(e.target.value)}
                                placeholder="-"
                            />
                        </div>

                        <div className="modal-separator">-</div>

                        <div className="modal-team">
                            <span className="modal-team-name">{match.teamAway.name}</span>
                            <input
                                type="number"
                                min="0"
                                className="modal-score-input"
                                value={scoreAway}
                                onChange={(e) => setScoreAway(e.target.value)}
                                placeholder="-"
                            />
                        </div>
                    </div>

                    <div className="modal-notes">
                        <label>Note Arbitro:</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Eventuali note..."
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Salvataggio...' : 'Salva Risultato'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
