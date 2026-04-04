require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Player = require('../models/Player');

const players = [
  // ───────────── GOALKEEPERS (10) ─────────────
  { name: 'Alisson Becker', position: 'GK', club: 'Liverpool', nationality: 'Brazil', basePrice: 8, rating: 89, age: 31, stats: { cleanSheets: 20, appearances: 38, goals: 0, assists: 1, saves: 89 } },
  { name: 'Ederson Moraes', position: 'GK', club: 'Manchester City', nationality: 'Brazil', basePrice: 8, rating: 89, age: 30, stats: { cleanSheets: 18, appearances: 36, goals: 0, assists: 0, saves: 75 } },
  { name: 'Marc-André ter Stegen', position: 'GK', club: 'Barcelona', nationality: 'Germany', basePrice: 7, rating: 88, age: 31, stats: { cleanSheets: 15, appearances: 30, goals: 0, assists: 0, saves: 82 } },
  { name: 'Manuel Neuer', position: 'GK', club: 'Bayern Munich', nationality: 'Germany', basePrice: 6, rating: 86, age: 38, stats: { cleanSheets: 16, appearances: 32, goals: 0, assists: 0, saves: 77 } },
  { name: 'Thibaut Courtois', position: 'GK', club: 'Real Madrid', nationality: 'Belgium', basePrice: 9, rating: 91, age: 31, stats: { cleanSheets: 22, appearances: 35, goals: 0, assists: 0, saves: 95 } },
  { name: 'Diogo Costa', position: 'GK', club: 'Porto', nationality: 'Portugal', basePrice: 5, rating: 84, age: 24, stats: { cleanSheets: 14, appearances: 34, goals: 0, assists: 0, saves: 88 } },
  { name: 'Mike Maignan', position: 'GK', club: 'AC Milan', nationality: 'France', basePrice: 7, rating: 87, age: 28, stats: { cleanSheets: 17, appearances: 35, goals: 0, assists: 0, saves: 91 } },
  { name: 'David Raya', position: 'GK', club: 'Arsenal', nationality: 'Spain', basePrice: 6, rating: 85, age: 28, stats: { cleanSheets: 16, appearances: 34, goals: 0, assists: 0, saves: 84 } },
  { name: 'Yann Sommer', position: 'GK', club: 'Inter Milan', nationality: 'Switzerland', basePrice: 5, rating: 85, age: 35, stats: { cleanSheets: 15, appearances: 33, goals: 0, assists: 0, saves: 79 } },
  { name: 'Jordan Pickford', position: 'GK', club: 'Everton', nationality: 'England', basePrice: 5, rating: 84, age: 30, stats: { cleanSheets: 12, appearances: 36, goals: 0, assists: 0, saves: 110 } },

  // ───────────── DEFENDERS (22) ─────────────
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
  { name: 'Jules Koundé', position: 'DEF', club: 'Barcelona', nationality: 'France', basePrice: 9, rating: 87, age: 25, stats: { goals: 3, assists: 5, cleanSheets: 0, appearances: 33 } },
  { name: 'Reece James', position: 'DEF', club: 'Chelsea', nationality: 'England', basePrice: 9, rating: 86, age: 24, stats: { goals: 4, assists: 7, cleanSheets: 0, appearances: 25 } },
  { name: 'Alejandro Grimaldo', position: 'DEF', club: 'Bayer Leverkusen', nationality: 'Spain', basePrice: 7, rating: 85, age: 28, stats: { goals: 7, assists: 12, cleanSheets: 0, appearances: 38 } },
  { name: 'Jesús Navas', position: 'DEF', club: 'Sevilla', nationality: 'Spain', basePrice: 4, rating: 80, age: 37, stats: { goals: 1, assists: 3, cleanSheets: 0, appearances: 30 } },
  { name: 'Raphaël Varane', position: 'DEF', club: 'Como', nationality: 'France', basePrice: 6, rating: 83, age: 31, stats: { goals: 1, assists: 1, cleanSheets: 0, appearances: 22 } },
  { name: 'Milan Škriniar', position: 'DEF', club: 'PSG', nationality: 'Slovakia', basePrice: 7, rating: 85, age: 29, stats: { goals: 2, assists: 1, cleanSheets: 0, appearances: 28 } },
  { name: 'Eder Militão', position: 'DEF', club: 'Real Madrid', nationality: 'Brazil', basePrice: 8, rating: 86, age: 25, stats: { goals: 3, assists: 1, cleanSheets: 0, appearances: 24 } },
  { name: 'Gvardiol Joško', position: 'DEF', club: 'Manchester City', nationality: 'Croatia', basePrice: 9, rating: 86, age: 22, stats: { goals: 5, assists: 3, cleanSheets: 0, appearances: 34 } },
  { name: 'Kieran Trippier', position: 'DEF', club: 'Newcastle', nationality: 'England', basePrice: 7, rating: 84, age: 33, stats: { goals: 4, assists: 9, cleanSheets: 0, appearances: 30 } },
  { name: 'Lucas Hernández', position: 'DEF', club: 'PSG', nationality: 'France', basePrice: 7, rating: 84, age: 27, stats: { goals: 1, assists: 2, cleanSheets: 0, appearances: 26 } },

  // ───────────── MIDFIELDERS (24) ─────────────
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
  { name: 'Granit Xhaka', position: 'MID', club: 'Bayer Leverkusen', nationality: 'Switzerland', basePrice: 7, rating: 84, age: 31, stats: { goals: 5, assists: 8, cleanSheets: 0, appearances: 38 } },
  { name: 'Florian Wirtz', position: 'MID', club: 'Bayer Leverkusen', nationality: 'Germany', basePrice: 14, rating: 89, age: 20, stats: { goals: 18, assists: 20, cleanSheets: 0, appearances: 40 } },
  { name: 'Jamal Musiala', position: 'MID', club: 'Bayern Munich', nationality: 'Germany', basePrice: 14, rating: 89, age: 21, stats: { goals: 12, assists: 11, cleanSheets: 0, appearances: 34 } },
  { name: 'Vitinha', position: 'MID', club: 'PSG', nationality: 'Portugal', basePrice: 9, rating: 85, age: 24, stats: { goals: 5, assists: 7, cleanSheets: 0, appearances: 35 } },
  { name: 'Alexis Mac Allister', position: 'MID', club: 'Liverpool', nationality: 'Argentina', basePrice: 10, rating: 86, age: 25, stats: { goals: 8, assists: 6, cleanSheets: 0, appearances: 36 } },
  { name: 'Ryan Gravenberch', position: 'MID', club: 'Liverpool', nationality: 'Netherlands', basePrice: 9, rating: 85, age: 22, stats: { goals: 4, assists: 5, cleanSheets: 0, appearances: 35 } },
  { name: 'Khvicha Kvaratskhelia', position: 'MID', club: 'PSG', nationality: 'Georgia', basePrice: 13, rating: 88, age: 23, stats: { goals: 14, assists: 13, cleanSheets: 0, appearances: 35 } },
  { name: 'Ilkay Gündogan', position: 'MID', club: 'Barcelona', nationality: 'Germany', basePrice: 8, rating: 85, age: 33, stats: { goals: 6, assists: 8, cleanSheets: 0, appearances: 32 } },
  { name: 'Mason Mount', position: 'MID', club: 'Manchester United', nationality: 'England', basePrice: 7, rating: 83, age: 25, stats: { goals: 3, assists: 4, cleanSheets: 0, appearances: 22 } },
  { name: 'Sofyan Amrabat', position: 'MID', club: 'Fiorentina', nationality: 'Morocco', basePrice: 6, rating: 82, age: 27, stats: { goals: 2, assists: 3, cleanSheets: 0, appearances: 30 } },

  // ───────────── FORWARDS (28) ─────────────
  { name: 'Erling Haaland', position: 'FWD', club: 'Manchester City', nationality: 'Norway', basePrice: 20, rating: 94, age: 23, stats: { goals: 36, assists: 8, cleanSheets: 0, appearances: 35 } },
  { name: 'Kylian Mbappé', position: 'FWD', club: 'Real Madrid', nationality: 'France', basePrice: 22, rating: 95, age: 25, stats: { goals: 44, assists: 11, cleanSheets: 0, appearances: 43 } },
  { name: 'Lionel Messi', position: 'FWD', club: 'Inter Miami', nationality: 'Argentina', basePrice: 18, rating: 93, age: 36, stats: { goals: 18, assists: 16, cleanSheets: 0, appearances: 27 } },
  { name: 'Cristiano Ronaldo', position: 'FWD', club: 'Al Nassr', nationality: 'Portugal', basePrice: 14, rating: 90, age: 39, stats: { goals: 35, assists: 5, cleanSheets: 0, appearances: 40 } },
  { name: 'Vinicius Júnior', position: 'FWD', club: 'Real Madrid', nationality: 'Brazil', basePrice: 19, rating: 92, age: 23, stats: { goals: 24, assists: 9, cleanSheets: 0, appearances: 39 } },
  { name: 'Bukayo Saka', position: 'FWD', club: 'Arsenal', nationality: 'England', basePrice: 15, rating: 90, age: 22, stats: { goals: 20, assists: 14, cleanSheets: 0, appearances: 38 } },
  { name: 'Harry Kane', position: 'FWD', club: 'Bayern Munich', nationality: 'England', basePrice: 16, rating: 91, age: 30, stats: { goals: 36, assists: 8, cleanSheets: 0, appearances: 35 } },
  { name: 'Mohamed Salah', position: 'FWD', club: 'Liverpool', nationality: 'Egypt', basePrice: 15, rating: 91, age: 31, stats: { goals: 29, assists: 12, cleanSheets: 0, appearances: 38 } },
  { name: 'Lautaro Martínez', position: 'FWD', club: 'Inter Milan', nationality: 'Argentina', basePrice: 14, rating: 90, age: 26, stats: { goals: 24, assists: 5, cleanSheets: 0, appearances: 34 } },
  { name: 'Robert Lewandowski', position: 'FWD', club: 'Barcelona', nationality: 'Poland', basePrice: 13, rating: 90, age: 35, stats: { goals: 26, assists: 8, cleanSheets: 0, appearances: 36 } },
  { name: 'Marcus Rashford', position: 'FWD', club: 'Manchester United', nationality: 'England', basePrice: 12, rating: 87, age: 26, stats: { goals: 17, assists: 5, cleanSheets: 0, appearances: 33 } },
  { name: 'Leroy Sané', position: 'FWD', club: 'Bayern Munich', nationality: 'Germany', basePrice: 11, rating: 87, age: 28, stats: { goals: 12, assists: 10, cleanSheets: 0, appearances: 32 } },
  { name: 'Phil Foden', position: 'FWD', club: 'Manchester City', nationality: 'England', basePrice: 16, rating: 91, age: 23, stats: { goals: 19, assists: 8, cleanSheets: 0, appearances: 35 } },
  { name: 'Rodrygo Goes', position: 'FWD', club: 'Real Madrid', nationality: 'Brazil', basePrice: 12, rating: 87, age: 22, stats: { goals: 14, assists: 8, cleanSheets: 0, appearances: 38 } },
  { name: 'Gabriel Martinelli', position: 'FWD', club: 'Arsenal', nationality: 'Brazil', basePrice: 11, rating: 86, age: 22, stats: { goals: 15, assists: 7, cleanSheets: 0, appearances: 35 } },
  { name: 'Raphinha', position: 'FWD', club: 'Barcelona', nationality: 'Brazil', basePrice: 10, rating: 86, age: 27, stats: { goals: 12, assists: 9, cleanSheets: 0, appearances: 34 } },
  { name: 'Antoine Griezmann', position: 'FWD', club: 'Atlético Madrid', nationality: 'France', basePrice: 11, rating: 87, age: 33, stats: { goals: 17, assists: 9, cleanSheets: 0, appearances: 36 } },
  { name: 'Álvaro Morata', position: 'FWD', club: 'AC Milan', nationality: 'Spain', basePrice: 8, rating: 84, age: 31, stats: { goals: 13, assists: 4, cleanSheets: 0, appearances: 32 } },
  { name: 'Olivier Giroud', position: 'FWD', club: 'LA Galaxy', nationality: 'France', basePrice: 5, rating: 81, age: 37, stats: { goals: 9, assists: 3, cleanSheets: 0, appearances: 26 } },
  { name: 'Ciro Immobile', position: 'FWD', club: 'Beşiktaş', nationality: 'Italy', basePrice: 6, rating: 83, age: 34, stats: { goals: 15, assists: 4, cleanSheets: 0, appearances: 30 } },
  { name: 'Ivan Toney', position: 'FWD', club: 'Al-Ahli', nationality: 'England', basePrice: 9, rating: 85, age: 28, stats: { goals: 16, assists: 5, cleanSheets: 0, appearances: 32 } },
  { name: 'Ollie Watkins', position: 'FWD', club: 'Aston Villa', nationality: 'England', basePrice: 10, rating: 86, age: 28, stats: { goals: 19, assists: 13, cleanSheets: 0, appearances: 37 } },
  { name: 'Cole Palmer', position: 'FWD', club: 'Chelsea', nationality: 'England', basePrice: 14, rating: 88, age: 22, stats: { goals: 22, assists: 11, cleanSheets: 0, appearances: 34 } },
  { name: 'Darwin Núñez', position: 'FWD', club: 'Liverpool', nationality: 'Uruguay', basePrice: 12, rating: 86, age: 24, stats: { goals: 18, assists: 8, cleanSheets: 0, appearances: 36 } },
  { name: 'Victor Osimhen', position: 'FWD', club: 'Galatasaray', nationality: 'Nigeria', basePrice: 14, rating: 88, age: 25, stats: { goals: 24, assists: 5, cleanSheets: 0, appearances: 32 } },
  { name: 'Rasmus Højlund', position: 'FWD', club: 'Manchester United', nationality: 'Denmark', basePrice: 10, rating: 84, age: 21, stats: { goals: 16, assists: 4, cleanSheets: 0, appearances: 33 } },
  { name: 'Dominic Calvert-Lewin', position: 'FWD', club: 'Everton', nationality: 'England', basePrice: 7, rating: 82, age: 27, stats: { goals: 11, assists: 3, cleanSheets: 0, appearances: 28 } },
  { name: 'Dušan Vlahović', position: 'FWD', club: 'Juventus', nationality: 'Serbia', basePrice: 12, rating: 86, age: 24, stats: { goals: 18, assists: 3, cleanSheets: 0, appearances: 32 } },
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