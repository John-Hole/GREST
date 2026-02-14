'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import MatchEditModal from '@/components/MatchEditModal';
import { useAuth } from '@/components/AuthProvider';

// Helper function to get current time slot based on time of day
const getCurrentTimeSlot = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // minutes from midnight

  // Define time slots in minutes from midnight
  const slots = [
    { time: 11 * 60, name: '11:00', tolerance: 30 },      // 660 min
    { time: 11 * 60 + 30, name: '11:30', tolerance: 30 }, // 690 min
    { time: 12 * 60, name: '12:00', tolerance: 30 },      // 720 min
    { time: 15 * 60, name: '15:00', tolerance: 30 },      // 900 min
    { time: 15 * 60 + 30, name: '15:30', tolerance: 30 }, // 930 min
    { time: 16 * 60, name: '16:00', tolerance: 30 }       // 960 min
  ];

  // Find the current or next slot
  for (let i = 0; i < slots.length; i++) {
    // If we're before the slot or during the slot (slot time + tolerance)
    if (currentTime < slots[i].time + slots[i].tolerance) {
      return slots[i].name;
    }
  }

  // If we're after all slots, return the last slot of the day
  return '16:00';
};

// Helper: format slot title as "Turno N mattina/pomeriggio"
const formatSlotTitle = (timeSlot) => {
  const mapping = {
    '11:00': 'Turno 1 mattina',
    '11:30': 'Turno 2 mattina',
    '12:00': 'Turno 3 mattina',
    '15:00': 'Turno 1 pomeriggio',
    '15:30': 'Turno 2 pomeriggio',
    '16:00': 'Turno 3 pomeriggio'
  };
  return mapping[timeSlot] ? `${mapping[timeSlot]} (${timeSlot})` : 'Prossimo Turno';
};

export default function Home() {
  const { user } = useAuth();
  const [currentMatches, setCurrentMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentTimeSlot, setCurrentTimeSlot] = useState(null);
  const [weekRange, setWeekRange] = useState({ start: 1, end: 5 });

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch matches
      const matchesRes = await fetch('/api/matches');
      const allMatches = await matchesRes.json();

      // Smart Turn Selection based on current time
      const targetSlot = getCurrentTimeSlot();
      const firstScheduled = allMatches.find(m => m.status === 'scheduled');

      let targetMatches = [];
      let slotTitle = '';
      let currentDay = 1;

      if (firstScheduled) {
        // Use the day from first scheduled match as reference for "current day"
        currentDay = firstScheduled.day;

        // Try to get matches for current day + target time slot
        targetMatches = allMatches.filter(m =>
          m.day === currentDay && m.timeSlot === targetSlot
        );

        // If no matches found for target slot, fallback to first scheduled
        if (targetMatches.length === 0) {
          targetMatches = allMatches.filter(m =>
            m.day === firstScheduled.day && m.timeSlot === firstScheduled.timeSlot
          );
          slotTitle = formatSlotTitle(firstScheduled.timeSlot);
        } else {
          // Successfully found matches for target slot
          slotTitle = formatSlotTitle(targetSlot);
        }
      } else {
        // No scheduled matches, show last matches
        const last = allMatches[allMatches.length - 1];
        if (last) {
          targetMatches = allMatches.filter(m =>
            m.day === last.day && m.timeSlot === last.timeSlot
          );
          currentDay = last.day;
          slotTitle = `Fine Giochi (${formatSlotTitle(last.timeSlot)})`;
        }
      }

      const weekNum = Math.ceil(currentDay / 5);
      const weekStart = (weekNum - 1) * 5 + 1;
      const weekEnd = weekStart + 4;

      setWeekRange({ start: weekStart, end: weekEnd });

      setCurrentMatches(targetMatches);
      setCurrentTimeSlot(slotTitle);

      // 3. Fetch Standings
      const standingsRes = await fetch('/api/standings');
      const standingsData = await standingsRes.json();
      setStandings(standingsData);

    } catch (err) {
      console.error('Error fetching home data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditMatch = (match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleSaveMatch = async (updatedData) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedData,
          status: 'completed' // Mark as completed when scores are saved
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData(); // Refresh both matches and standings
      } else {
        alert('Errore durante il salvataggio');
      }
    } catch (err) {
      console.error(err);
      alert('Errore di connessione');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}><div className="spinner"></div></div>;
  }

  return (
    <div className="home-page">

      <section className="section animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="section-header">
          <h2 className="section-title">
            {currentTimeSlot || 'Prossimo Turno'}
          </h2>
        </div>

        {currentMatches.length > 0 ? (
          <div className="grid-3 matches-grid">
            {currentMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                isAdminOrOperator={!!user}
                onClick={handleEditMatch}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Nessuna partita in programma</div>
        )}
      </section>

      <section className="section animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="section-title">
            <span>🏆</span> Classifica (Settimana {Math.ceil((weekRange.start) / 5)})
          </h2>
          <Link href="/classifica" className="btn btn-secondary btn-sm">
            Completa
          </Link>
        </div>

        <StandingsTable
          standings={standings}
          isAdmin={user?.role === 'admin'}
          startDay={weekRange.start}
          endDay={weekRange.end}
          useRelativeDays={true}
        />
      </section>

      <MatchEditModal
        isOpen={isModalOpen}
        match={selectedMatch}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMatch}
        isSaving={isSaving}
      />
    </div>
  );
}
