'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function RankingChart({ standings }) {
    if (!standings || standings.length === 0) return null;

    // 1. Determina quante giornate mostrare (l'ultima con punti assegnati)
    let maxDay = 0;
    standings.forEach(team => {
        if (team.dailyPoints) {
            team.dailyPoints.forEach((pts, day) => {
                if (pts !== 0 && day > maxDay) maxDay = day;
            });
        }
    });

    // Se non ci sono punti, mostriamo almeno la giornata 1
    if (maxDay === 0) maxDay = 1;

    const days = Array.from({ length: maxDay }, (_, i) => i + 1);

    // 2. Calcola i rank per ogni giornata
    const datasets = standings.map(team => {
        const rankData = days.map(day => {
            // Calcola la classifica totale fino a quel giorno per determinare il rank
            const dailyStandings = standings.map(t => {
                const totalUpToDay = (t.dailyPoints || []).slice(0, day + 1).reduce((sum, p) => sum + p, 0);
                return {
                    teamId: t.teamId,
                    points: totalUpToDay,
                    goalDiff: t.goalDiff || 0,
                    goalsFor: t.goalsFor || 0
                };
            }).sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
                return b.goalsFor - a.goalsFor;
            });

            // Trova la posizione della squadra corrente
            const rank = dailyStandings.findIndex(t => t.teamId === team.teamId) + 1;
            return rank;
        });

        // Colore di fallback se non presente
        const teamColor = team.colorHex || '#1565C0';

        return {
            label: team.teamName,
            data: rankData,
            borderColor: teamColor,
            backgroundColor: teamColor,
            tension: 0, // Linee rette come richiesto
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: teamColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
        };
    });

    const data = {
        labels: days.map(d => `G${d}`),
        datasets: datasets,
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                reverse: true,
                min: 1,
                max: Math.max(6, standings.length),
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    font: {
                        family: 'Inter',
                        weight: 'bold'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                title: {
                    display: true,
                    text: 'Posizione',
                    font: {
                        family: 'Inter',
                        weight: '600'
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: 'Inter',
                        weight: '600'
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: 'Inter',
                        size: 12,
                        weight: '500'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(21, 101, 192, 0.9)',
                titleFont: { family: 'Inter', size: 13 },
                bodyFont: { family: 'Inter', size: 12 },
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: (context) => ` ${context.dataset.label}: ${context.parsed.y}° posto`
                }
            }
        }
    };

    return (
        <div className="ranking-chart-wrapper animate-fade-in" style={{
            background: 'var(--color-bg-card)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '2.5rem',
            border: '1px solid var(--color-border)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                    Andamento Classifica
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: '500' }}>
                    Posizioni per giornata
                </span>
            </div>
            <div style={{ height: '350px', width: '100%' }}>
                <Line data={data} options={options} />
            </div>
        </div>
    );
}
