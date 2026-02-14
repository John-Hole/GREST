'use client';

import '../styles/match-card.css';

export default function MatchCard({ match, onClick, isAdminOrOperator }) {
    const isPending = match.scoreHome === null || match.scoreAway === null;
    const isScheduled = match.status === 'scheduled';

    const handleClick = () => {
        if (isAdminOrOperator && onClick) {
            onClick(match);
        }
    };

    return (
        <div
            className={`match-card ${isAdminOrOperator ? 'clickable' : ''}`}
            onClick={handleClick}
            role={isAdminOrOperator ? 'button' : undefined}
            tabIndex={isAdminOrOperator ? 0 : undefined}
        >
            <div className="match-header">
                <div className="match-game-name">
                    {match.gameName || 'Partita'}
                </div>
                {match.location && (
                    <div className="match-location-subtitle">
                        {match.location}
                    </div>
                )}
            </div>

            <div className="match-teams">
                <div className="match-team home">
                    <span>{match.teamHome.name}</span>
                    <span
                        className="team-color-dot"
                        style={{ backgroundColor: match.teamHome.color }}
                        title={match.teamHome.name}
                    />
                </div>

                <div className={`match-score ${isPending ? 'pending' : ''}`}>
                    {isPending
                        ? 'VS'
                        : `${match.scoreHome} - ${match.scoreAway}`
                    }
                </div>

                <div className="match-team away">
                    <span
                        className="team-color-dot"
                        style={{ backgroundColor: match.teamAway.color }}
                        title={match.teamAway.name}
                    />
                    <span>{match.teamAway.name}</span>
                </div>
            </div>

            <div className="match-status">
                {match.status === 'completed' && (
                    <span className="badge badge-success">✓ Completata</span>
                )}
            </div>

            {match.refereeNotes && (
                <div className="match-notes">
                    "{match.refereeNotes}"
                </div>
            )}
        </div>
    );
}
