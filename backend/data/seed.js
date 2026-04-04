require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Player = require('../models/Player');

const players = [
  // GOALKEEPERS
  { name: 'Alisson Becker', position: 'GK', club: 'Liverpool', nationality: 'Brazil', basePrice: 8, rating: 89, age: 31, stats: { cleanSheets: 20, appearances: 38, goals: 0, assists: 1, saves: 89 } },
  { name: 'Ederson Moraes', position: 'GK', club: 'Manchester City', nationality: 'Brazil', basePrice: 8, rating: 89, age: 30, stats: { cleanSheets: 18, appearances: 36, goals: 0, assists: 0, saves: 75 } },
  { name: 'Marc-André ter Stegen', position: 'GK', club: 'Barcelona', nationality: 'Germany', basePrice: 7, rating: 88, age: 31, stats: { cleanSheets: 15, appearances: 30, goals: 0, assists: 0, saves: 82 } },
  { name: 'Manuel Neuer', position: 'GK', club: 'Bayern Munich', nationality: 'Germany', basePrice: 6, rating: 86, age: 38, stats: { cleanSheets: 16, appearances: 32, goals: 0, assists: 0, saves: 77 } },
  { name: 'Thibaut Courtois', position: 'GK', club: 'Real Madrid', nationality: 'Belgium', basePrice: 9, rating: 91, age: 31, stats: { cleanSheets: 22, appearances: 35, goals: 0, assists: 0, saves: 95 } },
  { name: 'Diogo Costa', position: 'GK', club: 'Porto', nationality: 'Portugal', basePrice: 5, rating: 84, age: 24, stats: { cleanSheets: 14, appearances: 34, goals: 0, assists: 0, saves: 88 } },

  // DEFENDERS
  { name: 'Virgil van Dijk', position: 'DEF', club: 'Liverpool', nationality: 'Netherlands', basePrice: 10, rating: 90, age: 32, stats: { goals: 5, assists: 2, cleanSheets: 0, appearances: 37 } },
  { name: 'Rúben Dias', position: 'DEF', club: 'Manchester City', nationality: 'Portugal', basePrice: 10, rating: 89, age: 26, stats: { goals: 3, assists: 1, cleanSheets: 0, appearances: 35 } },
  { name: 'Marquinhos', position: 'DEF', club: 'PSG', nationality: 'Brazil', basePrice: 9, rating: 88, age: 29, stats: { goals: 4, assists: 2, cleanSheets: 0, appearances: 34 } },
  { name: 'Dayot Upamecano', position: 'DEF', club: 'Bayern Munich', nationality: 'France', basePrice: 8, rating: 86, age: 25, stats: { goals: 2, assists: 1, cleanSheets: 0, appearances: 30 } },
  { name: 'Trent Alexander-Arnold', position: 'DEF', club: 'Liverpool', nationality: 'England', basePrice: 11, rating: 88, age: 25, stats: { goals: 6, assists: 14, cleanSheets: 0, appearances: 36 } },
  { name: 'Achraf Hakimi', position: 'DEF', club: 'PSG', nationality: 'Morocco', basePrice: 10, rating: 87, age: 25, stats: { goals: 7, assists: 8, cleanSheets: 0, appearances: 35 } },
  { name: 'João Cancelo', position: 'DEF', club: 'Barcelona', nationality: 'Portugal', basePrice: 9, rating: 86, age: 29, stats: { goals: 3, assists: 9, cleanSheets: 0, appearances: 33 } },
  { name: 'Andrew Robertson', position: 'DEF', club: 'Liverpool', nationality: 'Scotland', basePrice: 8, rating: 86, age: 29, stats: { goals: 2, assists: 10, cleanSheets: 0, appearances: 35 } },
  { name: 'William Saliba', position: 'DEF', club: 'Arsenal', nationality: 'France', basePrice: 9, rating: 87, age: 22, stats: { goals: 2, assists: 2, cleanSheets: 0, appearances: 38 } },
  { name: 'Ben White', position: 'DEF', club: 'Arsenal', nationality: 'England', basePrice: 7, rating: 84, age: 26, stats: { goals: 2, assists: 6, cleanSheets: 0, appearances: 36 } },
  { name: 'Ronald Araújo', position: 'DEF', club: 'Barcelona', nationality: 'Uruguay', basePrice: 8, rating: 86, age: 24, stats: { goals: 3, assists: 1, cleanSheets: 0, appearances: 28 } },
  { name: 'Theo Hernández', position: 'DEF', club: 'AC Milan', nationality: 'France', basePrice: 9, rating: 87, age: 26, stats: { goals: 8, assists: 6, cleanSheets: 0, appearances: 34 } },

  // MIDFIELDERS
  { name: 'Kevin De Bruyne', position: 'MID', club: 'Manchester City', nationality: 'Belgium', basePrice: 15, rating: 93, age: 32, stats: { goals: 7, assists: 16, cleanSheets: 0, appearances: 32 } },
  { name: 'Luka Modrić', position: 'MID', club: 'Real Madrid', nationality: 'Croatia', basePrice: 9, rating: 87, age: 38, stats: { goals: 5, assists: 8, cleanSheets: 0, appearances: 34 } },
  { name: 'Toni Kroos', position: 'MID', club: 'Real Madrid', nationality: 'Germany', basePrice: 8, rating: 87, age: 34, stats: { goals: 4, assists: 12, cleanSheets: 0, appearances: 35 } },
  { name: 'Pedri González', position: 'MID', club: 'Barcelona', nationality: 'Spain', basePrice: 12, rating: 89, age: 21, stats: { goals: 8, assists: 9, cleanSheets: 0, appearances: 34 } },
  { name: 'Rodri Hernández', position: 'MID', club: 'Manchester City', nationality: 'Spain', basePrice: 13, rating: 91, age: 27, stats: { goals: 8, assists: 7, cleanSheets: 0, appearances: 35 } },
  { name: 'Jude Bellingham', position: 'MID', club: 'Real Madrid', nationality: 'England', basePrice: 18, rating: 92, age: 20, stats: { goals: 23, assists: 12, cleanSheets: 0, appearances: 35 } },
  { name: 'Declan Rice', position: 'MID', club: 'Arsenal', nationality: 'England', basePrice: 14, rating: 88, age: 25, stats: { goals: 7, assists: 8, cleanSheets: 0, appearances: 38 } },
  { name: 'Gavi Páez', position: 'MID', club: 'Barcelona', nationality: 'Spain', basePrice: 12, rating: 88, age: 19, stats: { goals: 4, assists: 6, cleanSheets: 0, appearances: 30 } },
  { name: 'Bernardo Silva', position: 'MID', club: 'Manchester City', nationality: 'Portugal', basePrice: 13, rating: 89, age: 29, stats: { goals: 8, assists: 10, cleanSheets: 0, appearances: 36 } },
  { name: 'Bruno Fernandes', position: 'MID', club: 'Manchester United', nationality: 'Portugal', basePrice: 12, rating: 88, age: 29, stats: { goals: 15, assists: 8, cleanSheets: 0, appearances: 35 } },
  { name: 'Eduardo Camavinga', position: 'MID', club: 'Real Madrid', nationality: 'France', basePrice: 11, rating: 87, age: 21, stats: { goals: 4, assists: 5, cleanSheets: 0, appearances: 32 } },
  { name: 'Frenkie de Jong', position: 'MID', club: 'Barcelona', nationality: 'Netherlands', basePrice: 10, rating: 86, age: 26, stats: { goals: 3, assists: 5, cleanSheets: 0, appearances: 29 } },
  { name: 'Martin Ødegaard', position: 'MID', club: 'Arsenal', nationality: 'Norway', basePrice: 13, rating: 88, age: 25, stats: { goals: 11, assists: 9, cleanSheets: 0, appearances: 35 } },
  { name: 'Nicolò Barella', position: 'MID', club: 'Inter Milan', nationality: 'Italy', basePrice: 10, rating: 87, age: 27, stats: { goals: 6, assists: 11, cleanSheets: 0, appearances: 36 } },

  // FORWARDS
  { name: 'Erling Haaland', position: 'FWD', club: 'Manchester City', nationality: 'Norway', basePrice: 20, rating: 94, age: 23, stats: { goals: 36, assists: 8, cleanSheets: 0, appearances: 35 } },
  { name: 'Kylian Mbappé', position: 'FWD', club: 'Real Madrid', nationality: 'France', basePrice: 22, rating: 95, age: 25, stats: { goals: 44, assists: 11, cleanSheets: 0, appearances: 43 } },
  { name: 'Lionel Messi', position: 'FWD', club: 'Inter Miami', nationality: 'Argentina', basePrice: 18, rating: 93, age: 36, stats: { goals: 18, assists: 16, cleanSheets: 0, appearances: 27 } },
  { name: 'Cristiano Ronaldo', position: 'FWD', club: 'Al Nassr', nationality: 'Portugal', basePrice: 14, rating: 90, age: 39, stats: { goals: 35, assists: 5, cleanSheets: 0, appearances: 40 } },
  { name: 'Vinicius Júnior', position: 'FWD', club: 'Real Madrid', nationality: 'Brazil', basePrice: 19, rating: 92, age: 23, stats: { goals: 24, assists: 9, cleanSheets: 0, appearances: 39 } },
  { name: 'Bukayo Saka', position: 'FWD', club: 'Arsenal', nationality: 'England', basePrice: 15, rating: 90, age: 22, stats: { goals: 20, assists: 14, cleanSheets: 0, appearances: 38 } },
  { name: 'Harry Kane', position: 'FWD', club: 'Bayern Munich', nationality: 'England', basePrice: 16, rating: 91, age: 30, stats: { goals: 36, assists: 8, cleanSheets: 0, appearances: 35 } },
  { name: 'Mohamed Salah', position: 'FWD', club: 'Liverpool', nationality: 'Egypt', basePrice: 15, rating: 91, age: 31, stats: { goals: 29, assists: 12, cleanSheets: 0, appearances: 38 } },
  { name: 'Neymar Jr', position: 'FWD', club: 'Al Hilal', nationality: 'Brazil', basePrice: 14, rating: 89, age: 31, stats: { goals: 6, assists: 4, cleanSheets: 0, appearances: 7 } },
  { name: 'Lautaro Martínez', position: 'FWD', club: 'Inter Milan', nationality: 'Argentina', basePrice: 14, rating: 90, age: 26, stats: { goals: 24, assists: 5, cleanSheets: 0, appearances: 34 } },
  { name: 'Robert Lewandowski', position: 'FWD', club: 'Barcelona', nationality: 'Poland', basePrice: 13, rating: 90, age: 35, stats: { goals: 26, assists: 8, cleanSheets: 0, appearances: 36 } },
  { name: 'Marcus Rashford', position: 'FWD', club: 'Manchester United', nationality: 'England', basePrice: 12, rating: 87, age: 26, stats: { goals: 17, assists: 5, cleanSheets: 0, appearances: 33 } },
  { name: 'Leroy Sané', position: 'FWD', club: 'Bayern Munich', nationality: 'Germany', basePrice: 11, rating: 87, age: 28, stats: { goals: 12, assists: 10, cleanSheets: 0, appearances: 32 } },
  { name: 'Phil Foden', position: 'FWD', club: 'Manchester City', nationality: 'England', basePrice: 16, rating: 91, age: 23, stats: { goals: 19, assists: 8, cleanSheets: 0, appearances: 35 } },
  { name: 'Rodrygo Goes', position: 'FWD', club: 'Real Madrid', nationality: 'Brazil', basePrice: 12, rating: 87, age: 22, stats: { goals: 14, assists: 8, cleanSheets: 0, appearances: 38 } },
  { name: 'Gabriel Martinelli', position: 'FWD', club: 'Arsenal', nationality: 'Brazil', basePrice: 11, rating: 86, age: 22, stats: { goals: 15, assists: 7, cleanSheets: 0, appearances: 35 } },
  { name: 'Raphinha', position: 'FWD', club: 'Barcelona', nationality: 'Brazil', basePrice: 10, rating: 86, age: 27, stats: { goals: 12, assists: 9, cleanSheets: 0, appearances: 34 } },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/football-auction');
    console.log('Connected to MongoDB');
    await Player.deleteMany({});
    await Player.insertMany(players);
    console.log(`✅ Seeded ${players.length} players`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
