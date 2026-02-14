'use strict';

/**
 * Advanced Tournament Scheduler with Field Distribution + Pairing Diversity
 * 
 * Requirements:
 * 1. Each team plays once on each field per period (morning/afternoon)
 * 2. Avoid repeating the same pairing in consecutive time slots
 * 3. Distribute pairings evenly across the tournament
 */

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Create a pairing key for two teams
 */
function getPairingKey(team1, team2) {
    return [team1, team2].sort((a, b) => a - b).join('-');
}

/**
 * Generate matches for one period with pairing diversity
 */
function generatePeriodMatchesWithDiversity(teams, timeSlots, recentPairings, globalPairingCounts) {
    const FIELDS = [0, 1, 2];
    const matches = [];

    // Track which field each team has been assigned to in this period
    const teamFieldAssignment = new Map();
    teams.forEach(t => teamFieldAssignment.set(t, []));

    // Track pairings in this period to avoid immediate repeats
    const periodPairings = new Set();

    for (const slot of timeSlots) {
        const solutionFound = tryAssignSlotWithDiversity(
            teams,
            FIELDS,
            teamFieldAssignment,
            slot,
            matches,
            recentPairings,
            periodPairings,
            globalPairingCounts
        );

        if (!solutionFound) {
            console.error('Warning: Could not find optimal assignment for slot', slot);
        }
    }

    return matches;
}

/**
 * Try to assign teams to fields for a single time slot, avoiding recent pairings
 */
function tryAssignSlotWithDiversity(teams, fields, teamFieldAssignment, slot, matches, recentPairings, periodPairings, globalPairingCounts, attempts = 0) {
    const MAX_ATTEMPTS = 500;

    if (attempts > MAX_ATTEMPTS) {
        // Fallback: just assign randomly
        const shuffled = shuffle([...teams]);
        for (let f = 0; f < fields.length; f++) {
            const home = shuffled[f * 2];
            const away = shuffled[f * 2 + 1];
            matches.push({
                timeSlot: slot,
                field: fields[f],
                home,
                away
            });
            teamFieldAssignment.get(home).push(fields[f]);
            teamFieldAssignment.get(away).push(fields[f]);

            const key = getPairingKey(home, away);
            recentPairings.add(key);
            periodPairings.add(key);
            globalPairingCounts.set(key, (globalPairingCounts.get(key) || 0) + 1);
        }
        return true;
    }

    // Get available teams
    const availableTeams = teams.filter(t => teamFieldAssignment.get(t).length < 3);

    if (availableTeams.length < 6) {
        return tryAssignSlotWithDiversity(teams, fields, teamFieldAssignment, slot, matches, recentPairings, periodPairings, globalPairingCounts, attempts + 1);
    }

    // Try to create 3 pairings, preferring less-used pairs
    let bestPairings = null;
    let bestScore = -Infinity;
    let bestFieldAssignment = null;

    for (let attempt = 0; attempt < 100; attempt++) {
        const shuffled = shuffle(availableTeams);
        const candidatePairings = [
            [shuffled[0], shuffled[1]],
            [shuffled[2], shuffled[3]],
            [shuffled[4], shuffled[5]]
        ];

        // Try to find valid field assignments for these pairings
        const shuffledFields = shuffle([...fields]);
        let fieldsValid = true;

        for (let i = 0; i < candidatePairings.length; i++) {
            const [home, away] = candidatePairings[i];
            const field = shuffledFields[i];

            if (teamFieldAssignment.get(home).includes(field) ||
                teamFieldAssignment.get(away).includes(field)) {
                fieldsValid = false;
                break;
            }
        }

        if (!fieldsValid) continue;

        // Score this set of pairings
        let score = 0;

        for (const [home, away] of candidatePairings) {
            const key = getPairingKey(home, away);

            // Strong penalty for recent pairings
            if (recentPairings.has(key)) {
                score -= 1000;
            }

            // Penalty for pairings already in this period
            if (periodPairings.has(key)) {
                score -= 500;
            }

            // Prefer pairings that haven't been used as much
            const count = globalPairingCounts.get(key) || 0;
            score -= count * 10;
        }

        if (score > bestScore) {
            bestScore = score;
            bestPairings = candidatePairings;
            bestFieldAssignment = shuffledFields;
        }
    }

    if (bestPairings === null) {
        // Couldn't find valid assignment, try again with different teams
        return tryAssignSlotWithDiversity(teams, fields, teamFieldAssignment, slot, matches, recentPairings, periodPairings, globalPairingCounts, attempts + 1);
    }

    // Commit the assignment
    for (let i = 0; i < bestPairings.length; i++) {
        const [home, away] = bestPairings[i];
        const field = bestFieldAssignment[i];

        matches.push({
            timeSlot: slot,
            field,
            home,
            away
        });

        teamFieldAssignment.get(home).push(field);
        teamFieldAssignment.get(away).push(field);

        const key = getPairingKey(home, away);
        recentPairings.add(key);
        periodPairings.add(key);
        globalPairingCounts.set(key, (globalPairingCounts.get(key) || 0) + 1);
    }

    return true;
}

const TIME_SLOTS_MORNING = ['11:00', '11:30', '12:00'];
const TIME_SLOTS_AFTERNOON = ['15:00', '15:30', '16:00'];
const LOCATIONS = ['Campo 1', 'Campo 2', 'Campo 3'];
const TEAMS = [1, 2, 3, 4, 5, 6];

function generateAllMatches() {
    const allMatches = [];
    const globalPairingCounts = new Map(); // Track total pairing counts

    for (let day = 1; day <= 15; day++) {
        // Track recent pairings (last 6 slots = 1 period)
        const recentPairings = new Set();

        // Generate morning matches
        const morningMatches = generatePeriodMatchesWithDiversity(
            TEAMS,
            TIME_SLOTS_MORNING,
            recentPairings,
            globalPairingCounts
        );

        // Clear recent for afternoon (but keep global counts)
        recentPairings.clear();

        // Generate afternoon matches
        const afternoonMatches = generatePeriodMatchesWithDiversity(
            TEAMS,
            TIME_SLOTS_AFTERNOON,
            recentPairings,
            globalPairingCounts
        );

        // Combine and format
        [...morningMatches, ...afternoonMatches].forEach(m => {
            allMatches.push({
                day,
                timeSlot: m.timeSlot,
                location: LOCATIONS[m.field],
                teamHomeId: m.home,
                teamAwayId: m.away
            });
        });
    }

    return allMatches;
}

// Maintain exports for compatibility
function generateRoundRobinRounds(numTeams, teamIds) {
    const teams = teamIds || Array.from({ length: numTeams }, (_, i) => i + 1);
    const rounds = [];
    const fixed = teams[0];
    const rotating = teams.slice(1);

    for (let round = 0; round < numTeams - 1; round++) {
        const matches = [];
        matches.push([fixed, rotating[0]]);

        for (let i = 1; i <= Math.floor((numTeams - 1) / 2); i++) {
            if (i < rotating.length - i) {
                matches.push([rotating[i], rotating[rotating.length - i]]);
            }
        }

        rounds.push(matches);
        const last = rotating.pop();
        rotating.unshift(last);
    }

    return rounds;
}

module.exports = { generateRoundRobinRounds, generateAllMatches, TIME_SLOTS_MORNING, TIME_SLOTS_AFTERNOON, LOCATIONS };
