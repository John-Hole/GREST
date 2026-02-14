const { generateAllMatches } = require('./lib/round-robin');

console.log('🔍 Verifying Match Schedule Constraints...\n');

const matches = generateAllMatches();

// Group by day
const dayGroups = {};
for (let day = 1; day <= 15; day++) {
    dayGroups[day] = matches.filter(m => m.day === day);
}

let allValid = true;

// Check each day
for (let day = 1; day <= 15; day++) {
    const dayMatches = dayGroups[day];

    console.log(`📅 Day ${day}:`);

    // Separate morning and afternoon
    const morning = dayMatches.filter(m => ['11:00', '11:30', '12:00'].includes(m.timeSlot));
    const afternoon = dayMatches.filter(m => ['15:00', '15:30', '16:00'].includes(m.timeSlot));

    // Check each team's field distribution
    for (let team = 1; team <= 6; team++) {
        // Morning fields
        const morningFields = new Set();
        morning.forEach(m => {
            if (m.teamHomeId === team || m.teamAwayId === team) {
                morningFields.add(m.location);
            }
        });

        // Afternoon fields  
        const afternoonFields = new Set();
        afternoon.forEach(m => {
            if (m.teamHomeId === team || m.teamAwayId === team) {
                afternoonFields.add(m.location);
            }
        });

        const morningOK = morningFields.size === 3;
        const afternoonOK = afternoonFields.size === 3;

        if (!morningOK || !afternoonOK) {
            console.log(`  ❌ Team ${team}: Morning fields: ${morningFields.size}/3, Afternoon fields: ${afternoonFields.size}/3`);
            allValid = false;
        }
    }

    if (allValid) {
        console.log(`  ✅ All teams play once on each field in morning and afternoon`);
    }
    console.log('');
}

// Overall statistics
console.log('\n📊 Overall Statistics:');
console.log(`Total matches: ${matches.length}`);
console.log(`Matches per day: ${matches.length / 15}`);

// Count how many times each pair plays
const pairCounts = {};
matches.forEach(m => {
    const pair = [m.teamHomeId, m.teamAwayId].sort().join('-');
    pairCounts[pair] = (pairCounts[pair] || 0) + 1;
});

console.log('\nPair play counts:');
Object.entries(pairCounts).sort().forEach(([pair, count]) => {
    console.log(`  ${pair}: ${count} times`);
});

const counts = Object.values(pairCounts);
const minCount = Math.min(...counts);
const maxCount = Math.max(...counts);
const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

console.log(`\nFairness: Min=${minCount}, Max=${maxCount}, Avg=${avgCount.toFixed(1)}`);

if (allValid) {
    console.log('\n✅ All constraints satisfied!');
} else {
    console.log('\n❌ Some constraints violated!');
    process.exit(1);
}
