'use strict';

const bcrypt = require('bcryptjs');
const { generateAllMatches } = require('./round-robin');

function seedDatabase(db) {
    console.log('Seeding database...');

    // Seed users
    const insertUser = db.prepare(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
    );

    const adminHash = bcrypt.hashSync('admin123', 10);
    const operatorHash = bcrypt.hashSync('operator123', 10);

    insertUser.run('admin', adminHash, 'admin');
    insertUser.run('operatore', operatorHash, 'operator');

    // Seed teams
    const insertTeam = db.prepare(
        'INSERT INTO teams (name, color_hex) VALUES (?, ?)'
    );

    const teams = [
        { name: 'Squadra 1', color_hex: '#FF0000' },
        { name: 'Squadra 2', color_hex: '#0000FF' },
        { name: 'Squadra 3', color_hex: '#00FF00' },
        { name: 'Squadra 4', color_hex: '#FFFF00' },
        { name: 'Squadra 5', color_hex: '#FF00FF' },
        { name: 'Squadra 6', color_hex: '#00FFFF' },
    ];

    for (const team of teams) {
        insertTeam.run(team.name, team.color_hex);
    }

    // Seed locations (Initial locations removed as per user request)
    /*
    const insertLocation = db.prepare(
        'INSERT OR IGNORE INTO locations (name) VALUES (?)'
    );
    const initialLocations = ['Campo 1', 'Campo 2', 'Campo 3', 'Campetto', 'Tetto', 'Salone'];
    for (const loc of initialLocations) {
        insertLocation.run(loc);
    }
    */

    // Seed matches using round-robin algorithm
    const insertMatch = db.prepare(
        'INSERT INTO matches (day, time_slot, location, team_home_id, team_away_id, referee, game_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const allMatches = generateAllMatches();
    const insertMany = db.transaction((matches) => {
        for (const m of matches) {
            // Using default location from round-robin, no referee or game name initially
            insertMatch.run(m.day, m.timeSlot, m.location, m.teamHomeId, m.teamAwayId, null, null);
        }
    });
    insertMany(allMatches);

    console.log(`Seeded ${allMatches.length} matches.`);

    // Seed tournament config (dates)
    const insertConfig = db.prepare(
        'INSERT INTO tournament_config (day_number, real_date) VALUES (?, ?)'
    );

    const dates = [];
    const startDate = new Date('2025-06-15');
    let current = new Date(startDate);
    let count = 1;

    while (count <= 15) {
        // Simple logic: Skip Sunday (0). You can adjust to skip Saturday (6) if needed.
        if (current.getDay() !== 0) {
            dates.push({
                day_number: count,
                real_date: current.toISOString().split('T')[0]
            });
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    for (const d of dates) {
        insertConfig.run(d.day_number, d.real_date);
    }

    console.log('Database seeded successfully!');
}

module.exports = { seedDatabase };
