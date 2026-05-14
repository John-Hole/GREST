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

    // 1. Determina l'ultima giornata con punti assegnati (dove siamo arrivati)
    let lastPlayedDay = 0;
    standings.forEach(team => {
        if (team.dailyPoints) {
            team.dailyPoints.forEach((pts, day) => {
                if (pts !== 0 && day > lastPlayedDay) lastPlayedDay = day;
            });
        }
    });

    // Mostriamo sempre tutte le 15 giornate sull'asse X
    const totalDays = 15;
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    // 2. Calcola i rank per ogni giornata giocata
    const datasets = standings.map(team => {
        const rankData = days.map(day => {
            // Se la giornata non è ancora stata giocata, non restituiamo dati per far fermare la linea
            if (day > lastPlayedDay) return null;

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

        // Creiamo un array per il raggio dei punti: piccoli per il passato, grande per l'ultimo, 0 per il futuro
        const pointRadii = rankData.map((val, idx) => {
            if (val === null) return 0;
            if (idx === lastPlayedDay - 1) return 6; // Pallino attuale
            return 2.5; // Micro-pallini storici
        });

        return {
            label: team.teamName,
            data: rankData,
            borderColor: teamColor,
            backgroundColor: teamColor,
            tension: 0,
            borderWidth: 2, // Linee più sottili
            pointRadius: pointRadii,
            pointHoverRadius: pointRadii.map(r => r > 0 ? r + 2 : 0),
            pointBackgroundColor: teamColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            spanGaps: false
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
                    font: { family: 'Inter', weight: 'bold' }
                },
                grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                title: { display: true, text: 'Posizione', font: { family: 'Inter', weight: '600' } }
            },
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Inter', weight: '600' } }
            }
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: { family: 'Inter', size: 12, weight: '500' }
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
                    G1 - G15
                </span>
            </div>
            <div style={{ height: '350px', width: '100%' }}>
                <Line data={data} options={options} />
            </div>
        </div>
    );
}
