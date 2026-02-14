'use client';

import '../styles/standings.css';

export default function StandingsTable({ standings, isAdmin = false, startDay = 1, endDay = 15, useRelativeDays = false }) {
    const days = [];
    for (let i = startDay; i <= endDay; i++) {
        days.push(i);
    }

    return (
        <div className="standings-container">
            <div className="table-responsive">
                <table className="standings-table">
                    <thead>
                        <tr>
                            <th className="col-pos">Pos</th>
                            <th className="col-team">Squadra</th>
                            {days.map(d => (
                                <th key={d} className="col-day">
                                    G{useRelativeDays ? ((d - 1) % 5 + 1) : d}
                                </th>
                            ))}
                            <th className="col-dr" title="Differenza Reti">DR</th>
                            <th className="col-total">Punti</th>
                            {isAdmin && <th className="col-bonus">Bonus</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((team, index) => (
                            <tr key={team.teamId}>
                                <td>
                                    <span className={`pos-badge ${index < 3 ? `pos-${index + 1}` : ''}`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td>
                                    <div className="team-name-cell">
                                        <span
                                            className="team-color-dot"
                                            style={{ backgroundColor: team.colorHex }}
                                        />
                                        {team.teamName}
                                    </div>
                                </td>
                                {days.map(d => (
                                    <td key={d} className="day-points">
                                        {team.dailyPoints[d] || 0}
                                    </td>
                                ))}
                                <td className={`day-points ${team.goalDiff > 0 ? 'positive' : team.goalDiff < 0 ? 'negative' : ''}`} style={{ fontWeight: '500' }}>
                                    {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                                </td>
                                <td className="total-points">{team.totalPoints}</td>
                                {isAdmin && (
                                    <td className={`bonus-col ${team.bonusMalusTotal > 0 ? 'positive' : team.bonusMalusTotal < 0 ? 'negative' : ''}`}>
                                        {team.bonusMalusTotal > 0 ? `+${team.bonusMalusTotal}` : team.bonusMalusTotal}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {standings.length === 0 && (
                            <tr>
                                <td colSpan={days.length + (isAdmin ? 4 : 3)} style={{ textAlign: 'center', padding: '2rem' }}>
                                    Nessuna squadra in classifica
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
