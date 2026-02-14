const { generateAllMatches } = require('./lib/round-robin');

const matches = generateAllMatches();

function checkPeriod(day, slots) {
    const periodMatches = matches.filter(m => m.day === day && slots.includes(m.timeSlot));
    const stats = {};
    for (let i = 1; i <= 6; i++) stats[i] = { 0: 0, 1: 0, 2: 0 };

    periodMatches.forEach(m => {
        const fieldIndex = ['Campo 1', 'Campo 2', 'Campo 3'].indexOf(m.location);
        stats[m.teamHomeId][fieldIndex]++;
        stats[m.teamAwayId][fieldIndex]++;
    });

    console.log(`Day ${day} Period (${slots[0]}-${slots[slots.length - 1]}) rotation:`);
    console.table(stats);

    // Check if everyone played once on each field
    for (let t = 1; t <= 6; t++) {
        for (let f = 0; f < 3; f++) {
            if (stats[t][f] !== 1) {
                console.log(`❌ FAIL: Team ${t} on field ${f} played ${stats[t][f]} times!`);
                return false;
            }
        }
    }
    console.log("✅ SUCCESS: Perfect rotation found!");
    return true;
}

const MORNING = ['11:00', '11:30', '12:00'];
const AFTERNOON = ['15:00', '15:30', '16:00'];

checkPeriod(1, MORNING);
checkPeriod(1, AFTERNOON);
checkPeriod(2, MORNING);
checkPeriod(2, AFTERNOON);
